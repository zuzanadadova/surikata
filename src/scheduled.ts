import type { Env } from "./types";
import { fetchAndParseFeed } from "./rss/parser";

// Runs on the Cron Trigger schedule (see wrangler.toml [triggers]).
// Fetches every distinct subscribed feed and upserts new articles into D1.
export async function handleScheduled(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    "SELECT DISTINCT feed_url FROM user_feeds"
  ).all<{ feed_url: string }>();

  const feedUrls = results.map((r) => r.feed_url);

  await Promise.allSettled(
    feedUrls.map(async (feedUrl) => {
      const articles = await fetchAndParseFeed(feedUrl);
      if (articles.length === 0) return;

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
    })
  );
}
