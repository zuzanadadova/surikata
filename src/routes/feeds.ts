import { Hono } from "hono";
import type { Env } from "../types";
import { layout } from "../views/layout";
import { renderArticleList, type ArticleCardData } from "../views/article-card";

export const feedRoutes = new Hono<{ Bindings: Env }>();

type ViewMode = "feed" | "readlater" | "favorites";

interface FilterParams {
  source: string; // 'all' or a feed_url
  hideRead: boolean;
  view: ViewMode;
}

function parseFilters(c: any): FilterParams {
  const source = c.req.query("source") || "all";
  const hideRead = c.req.query("hideRead") === "1";
  const viewParam = c.req.query("view");
  const view: ViewMode = viewParam === "readlater" || viewParam === "favorites" ? viewParam : "feed";
  return { source, hideRead, view };
}

async function fetchFeedArticles(
  db: Env["DB"],
  userId: number,
  filters: FilterParams
): Promise<ArticleCardData[]> {
  const query = `
    SELECT
      a.link, a.title, a.perex, a.image_url AS imageUrl, uf.feed_name AS sourceName, a.feed_url,
      EXISTS(SELECT 1 FROM read_articles ra WHERE ra.user_id = ?1 AND ra.article_link = a.link) AS isRead,
      EXISTS(SELECT 1 FROM read_later rl WHERE rl.user_id = ?1 AND rl.article_link = a.link) AS isReadLater,
      EXISTS(SELECT 1 FROM favorites fv WHERE fv.user_id = ?1 AND fv.article_link = a.link) AS isFavorite
    FROM articles a
    JOIN user_feeds uf ON uf.feed_url = a.feed_url AND uf.user_id = ?1
    WHERE (?2 = 'all' OR a.feed_url = ?2)
    ORDER BY a.published_at DESC, a.id DESC
    LIMIT 150
  `;
  const { results } = await db
    .prepare(query)
    .bind(userId, filters.source)
    .all<any>();

  let rows = results.map((r: any) => ({
    link: r.link,
    title: r.title,
    perex: r.perex,
    imageUrl: r.imageUrl,
    sourceName: r.sourceName,
    isRead: !!r.isRead,
    isReadLater: !!r.isReadLater,
    isFavorite: !!r.isFavorite,
  })) as ArticleCardData[];

  if (filters.hideRead) {
    rows = rows.filter((r) => !r.isRead);
  }

  return rows;
}

async function fetchReadLaterArticles(db: Env["DB"], userId: number): Promise<ArticleCardData[]> {
  const { results } = await db
    .prepare(
      `SELECT rl.article_link AS link, rl.title, rl.perex, rl.image_url AS imageUrl, rl.source AS sourceName,
        EXISTS(SELECT 1 FROM read_articles ra WHERE ra.user_id = ?1 AND ra.article_link = rl.article_link) AS isRead,
        1 AS isReadLater,
        EXISTS(SELECT 1 FROM favorites fv WHERE fv.user_id = ?1 AND fv.article_link = rl.article_link) AS isFavorite
      FROM read_later rl WHERE rl.user_id = ?1 ORDER BY rl.saved_at DESC`
    )
    .bind(userId)
    .all<any>();

  return results.map((r: any) => ({
    link: r.link,
    title: r.title,
    perex: r.perex,
    imageUrl: r.imageUrl,
    sourceName: r.sourceName,
    isRead: !!r.isRead,
    isReadLater: true,
    isFavorite: !!r.isFavorite,
  }));
}

async function fetchFavoriteArticles(db: Env["DB"], userId: number): Promise<ArticleCardData[]> {
  const { results } = await db
    .prepare(
      `SELECT fv.article_link AS link, fv.title, fv.perex, fv.image_url AS imageUrl, fv.source AS sourceName,
        EXISTS(SELECT 1 FROM read_articles ra WHERE ra.user_id = ?1 AND ra.article_link = fv.article_link) AS isRead,
        EXISTS(SELECT 1 FROM read_later rl WHERE rl.user_id = ?1 AND rl.article_link = fv.article_link) AS isReadLater,
        1 AS isFavorite
      FROM favorites fv WHERE fv.user_id = ?1 ORDER BY fv.saved_at DESC`
    )
    .bind(userId)
    .all<any>();

  return results.map((r: any) => ({
    link: r.link,
    title: r.title,
    perex: r.perex,
    imageUrl: r.imageUrl,
    sourceName: r.sourceName,
    isRead: !!r.isRead,
    isReadLater: !!r.isReadLater,
    isFavorite: true,
  }));
}

async function getArticlesForFilters(
  db: Env["DB"],
  userId: number,
  filters: FilterParams
): Promise<ArticleCardData[]> {
  if (filters.view === "readlater") return fetchReadLaterArticles(db, userId);
  if (filters.view === "favorites") return fetchFavoriteArticles(db, userId);
  return fetchFeedArticles(db, userId, filters);
}

function renderChips(sources: { feed_url: string; feed_name: string }[], activeSource: string): string {
  const allChip = `<button type="button" class="chip flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${activeSource === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-source="all">All</button>`;
  const chips = sources
    .map(
      (s) =>
        `<button type="button" class="chip flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${activeSource === s.feed_url ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-source="${s.feed_url}">${s.feed_name}</button>`
    )
    .join("");
  return `<div class="flex gap-2 overflow-x-auto px-4 py-3 -mx-4 scrollbar-hide">${allChip}${chips}</div>`;
}

feedRoutes.get("/", async (c) => {
  const user = c.get("user");
  const filters = parseFilters(c);

  const { results: sources } = await c.env.DB.prepare(
    "SELECT feed_url, feed_name FROM user_feeds WHERE user_id = ? ORDER BY feed_name"
  )
    .bind(user.id)
    .all<{ feed_url: string; feed_name: string }>();

  const articles = await getArticlesForFilters(c.env.DB, user.id, filters);

  const body = `
    <div class="sticky top-0 md:top-[57px] z-10 bg-gray-50/95 backdrop-blur border-b border-gray-200">
      ${renderChips(sources, filters.source)}
      <div class="flex items-center gap-2 px-4 pb-3 text-sm">
        <button type="button" id="toggle-hideread" class="toggle-btn px-3 py-1.5 rounded-full ${filters.hideRead ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-active="${filters.hideRead}">Hide Read</button>
        <button type="button" id="toggle-readlater" class="toggle-btn px-3 py-1.5 rounded-full ${filters.view === "readlater" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-view="readlater">Read Later</button>
        <button type="button" id="toggle-favorites" class="toggle-btn px-3 py-1.5 rounded-full ${filters.view === "favorites" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-view="favorites">Favorites</button>
        <button type="button" id="mark-all-read" class="ml-auto px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">Mark all read</button>
      </div>
    </div>
    <div id="feed-list" class="p-4">
      ${renderArticleList(articles)}
    </div>
  `;

  return c.html(
    layout({
      title: "Feed",
      activeNav: "home",
      username: user.username,
      bodyHtml: body,
    })
  );
});

feedRoutes.get("/partials/feed", async (c) => {
  const user = c.get("user");
  const filters = parseFilters(c);
  const articles = await getArticlesForFilters(c.env.DB, user.id, filters);
  return c.html(renderArticleList(articles));
});

feedRoutes.post("/articles/read", async (c) => {
  const user = c.get("user");
  const { link } = await c.req.json<{ link: string }>();
  if (!link) return c.json({ error: "link required" }, 400);
  await c.env.DB.prepare(
    "INSERT INTO read_articles (user_id, article_link) VALUES (?, ?) ON CONFLICT (user_id, article_link) DO NOTHING"
  )
    .bind(user.id, link)
    .run();
  return c.json({ ok: true });
});

feedRoutes.post("/articles/mark-all-read", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<Partial<FilterParams>>();
  const filters: FilterParams = {
    source: body.source || "all",
    hideRead: false,
    view: body.view === "readlater" || body.view === "favorites" ? body.view : "feed",
  };
  const articles = await getArticlesForFilters(c.env.DB, user.id, filters);
  const unread = articles.filter((a) => !a.isRead);
  if (unread.length > 0) {
    const stmt = c.env.DB.prepare(
      "INSERT INTO read_articles (user_id, article_link) VALUES (?, ?) ON CONFLICT (user_id, article_link) DO NOTHING"
    );
    await c.env.DB.batch(unread.map((a) => stmt.bind(user.id, a.link)));
  }
  return c.json({ ok: true, marked: unread.length });
});

interface ArticleMeta {
  link: string;
  title: string;
  source: string;
  perex: string | null;
  imageUrl: string | null;
}

feedRoutes.post("/articles/toggle-readlater", async (c) => {
  const user = c.get("user");
  const meta = await c.req.json<ArticleMeta>();
  if (!meta.link) return c.json({ error: "link required" }, 400);

  const existing = await c.env.DB.prepare(
    "SELECT 1 FROM read_later WHERE user_id = ? AND article_link = ?"
  )
    .bind(user.id, meta.link)
    .first();

  if (existing) {
    await c.env.DB.prepare("DELETE FROM read_later WHERE user_id = ? AND article_link = ?")
      .bind(user.id, meta.link)
      .run();
    return c.json({ ok: true, active: false });
  }

  await c.env.DB.prepare(
    "INSERT INTO read_later (user_id, article_link, title, source, perex, image_url) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(user.id, meta.link, meta.title, meta.source, meta.perex, meta.imageUrl)
    .run();
  return c.json({ ok: true, active: true });
});

feedRoutes.post("/articles/toggle-favorite", async (c) => {
  const user = c.get("user");
  const meta = await c.req.json<ArticleMeta>();
  if (!meta.link) return c.json({ error: "link required" }, 400);

  const existing = await c.env.DB.prepare(
    "SELECT 1 FROM favorites WHERE user_id = ? AND article_link = ?"
  )
    .bind(user.id, meta.link)
    .first();

  if (existing) {
    await c.env.DB.prepare("DELETE FROM favorites WHERE user_id = ? AND article_link = ?")
      .bind(user.id, meta.link)
      .run();
    return c.json({ ok: true, active: false });
  }

  await c.env.DB.prepare(
    "INSERT INTO favorites (user_id, article_link, title, source, perex, image_url) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(user.id, meta.link, meta.title, meta.source, meta.perex, meta.imageUrl)
    .run();
  return c.json({ ok: true, active: true });
});
