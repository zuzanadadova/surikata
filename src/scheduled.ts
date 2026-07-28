import type { Env } from "./types";
import { fetchFeedXml, parseFeed } from "./rss/parser";
import { fetchOgImage } from "./rss/scrape";

export interface ScheduledSummary {
  feedsAttempted: number;
  articlesUpserted: number;
  imagesScraped: number;
}

export interface FeedIngestResult {
  ok: boolean;
  articleCount: number;
  error?: string;
}

// Cap on og:image scrape fetches per invocation, across all feeds, to stay
// under Cloudflare Workers' subrequest/CPU-time limits. Any imageless
// articles left over stay image_scrape_attempted = 0 and get picked up on
// the next scheduled run/refresh.
const MAX_SCRAPE_PER_RUN = 30;

// Fetches, parses, and upserts articles for a single feed URL. Used both by
// the scheduled cron job (all subscribed feeds) and immediately when a user
// adds a new custom feed (so they don't have to wait for the next cron run).
// Never throws — network/parse failures are reported via `ok: false` so
// callers can degrade gracefully (the feed subscription stays saved either
// way, and will be retried on the next scheduled run).
export async function upsertArticlesForFeed(env: Env, feedUrl: string): Promise<FeedIngestResult> {
  let xml: string;
  try {
    xml = await fetchFeedXml(feedUrl);
  } catch (err) {
    return { ok: false, articleCount: 0, error: err instanceof Error ? err.message : "Fetch failed" };
  }

  const articles = parseFeed(xml);
  if (articles.length === 0) {
    return { ok: true, articleCount: 0 };
  }

  const stmt = env.DB.prepare(
    `INSERT INTO articles (feed_url, link, title, perex, image_url, published_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (feed_url, link) DO UPDATE SET
       title = excluded.title,
       perex = excluded.perex,
       image_url = excluded.image_url,
       published_at = excluded.published_at`
  );

  const batch = articles.map((a) =>
    stmt.bind(feedUrl, a.link, a.title, a.perex, a.imageUrl, a.publishedAt)
  );

  await env.DB.batch(batch);
  return { ok: true, articleCount: articles.length };
}

// Runs on the Cron Trigger schedule (see wrangler.toml [triggers]).
// Fetches every distinct subscribed feed and upserts new articles into D1.
export async function handleScheduled(env: Env): Promise<ScheduledSummary> {
  const { results } = await env.DB.prepare(
    "SELECT DISTINCT feed_url FROM user_feeds"
  ).all<{ feed_url: string }>();

  const feedUrls = results.map((r) => r.feed_url);
  let articlesUpserted = 0;

  await Promise.allSettled(
    feedUrls.map(async (feedUrl) => {
      const result = await upsertArticlesForFeed(env, feedUrl);
      articlesUpserted += result.articleCount;
    })
  );

  const imagesScraped = await scrapeMissingImages(env);

  return { feedsAttempted: feedUrls.length, articlesUpserted, imagesScraped };
}

// Bulletproof image fallback: for articles with no RSS-declared image that
// we haven't tried scraping yet, fetch the article page's og:image meta tag.
// Scraped exactly once per article ("cache forever") — success or failure,
// image_scrape_attempted is set so it's never retried.
async function scrapeMissingImages(env: Env): Promise<number> {
  const { results } = await env.DB.prepare(
    `SELECT id, link FROM articles WHERE image_url IS NULL AND image_scrape_attempted = 0 LIMIT ?`
  )
    .bind(MAX_SCRAPE_PER_RUN)
    .all<{ id: number; link: string }>();

  if (results.length === 0) return 0;

  const outcomes = await Promise.allSettled(
    results.map(async (row) => {
      const imageUrl = await fetchOgImage(row.link);
      await env.DB.prepare(
        "UPDATE articles SET image_url = COALESCE(?, image_url), image_scrape_attempted = 1 WHERE id = ?"
      )
        .bind(imageUrl, row.id)
        .run();
      return imageUrl;
    })
  );

  return outcomes.filter((o) => o.status === "fulfilled" && o.value).length;
}
