import { Hono } from "hono";
import type { Env } from "../types";
import { PRESET_FEEDS } from "../types";
import { layout } from "../views/layout";
import { fetchFeedXml, extractChannelTitle } from "../rss/parser";
import { upsertArticlesForFeed } from "../scheduled";
import { t } from "../i18n";

export const adminRoutes = new Hono<{ Bindings: Env }>();

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function renderAdminPage(
  c: any,
  subscribedUrls: Set<string>,
  customFeeds: { feed_url: string; feed_name: string }[],
  message?: string
) {
  const user = c.get("user");

  const extraFeeds = customFeeds.filter((f) => !PRESET_FEEDS.some((p) => p.url === f.feed_url));
  const allSources: { name: string; url: string }[] = [
    ...PRESET_FEEDS.map((f) => ({ name: f.name, url: f.url })),
    ...extraFeeds.map((f) => ({ name: f.feed_name, url: f.feed_url })),
  ];

  const allChecked = allSources.length > 0 && allSources.every((f) => subscribedUrls.has(f.url));

  const sourcesHtml = allSources
    .map(
      (f) => `
    <label class="flex items-center justify-between py-3 border-b border-gray-100">
      <span class="text-sm font-medium text-gray-900">${escapeHtml(f.name)}</span>
      <input type="checkbox" class="preset-toggle w-5 h-5 accent-gray-900" data-url="${escapeHtml(f.url)}" data-name="${escapeHtml(f.name)}" ${subscribedUrls.has(f.url) ? "checked" : ""} />
    </label>`
    )
    .join("");

  const selectAllHtml = `
    <label class="flex items-center justify-between py-3 border-b border-gray-200">
      <span class="text-sm font-semibold text-gray-500 uppercase tracking-wide">${t.admin.selectAll}</span>
      <input type="checkbox" id="select-all-sources" class="w-5 h-5 accent-gray-900" ${allChecked ? "checked" : ""} />
    </label>`;

  const body = `
    <div class="p-4 space-y-6">
      ${message ? `<div class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">${escapeHtml(message)}</div>` : ""}

      <section>
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">${t.admin.selectSources}</h2>
        </div>
        <p class="text-sm text-gray-500 mb-2">${t.admin.selectSourcesDesc}</p>
        <div class="bg-white rounded-xl border border-gray-200 px-4">${selectAllHtml}${sourcesHtml}</div>
      </section>

      <section>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">${t.admin.addCustomFeed}</h2>
        <p class="text-sm text-gray-500 mb-2">${t.admin.addCustomFeedDesc}</p>
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <input id="custom-url" type="text" placeholder="${t.admin.urlPlaceholder}"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
          <button type="button" id="discover-btn" class="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">${t.admin.fetchFeed}</button>
          <div id="discover-results" class="space-y-2"></div>
        </div>
      </section>
    </div>
  `;

  return c.html(
    layout({
      title: t.admin.title,
      activeNav: "admin",
      username: user.username,
      bodyHtml: body,
    })
  );
}

adminRoutes.get("/admin", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    "SELECT feed_url, feed_name FROM user_feeds WHERE user_id = ? ORDER BY feed_name"
  )
    .bind(user.id)
    .all<{ feed_url: string; feed_name: string }>();

  const subscribedUrls = new Set(results.map((r: { feed_url: string }) => r.feed_url));
  return renderAdminPage(c, subscribedUrls, results);
});

adminRoutes.post("/admin/feeds/toggle-preset", async (c) => {
  const user = c.get("user");
  const { url, name, subscribe } = await c.req.json<{ url: string; name: string; subscribe: boolean }>();
  if (!url || !name) return c.json({ error: "url and name required" }, 400);

  if (subscribe) {
    await c.env.DB.prepare(
      "INSERT INTO user_feeds (user_id, feed_url, feed_name) VALUES (?, ?, ?) ON CONFLICT (user_id, feed_url) DO NOTHING"
    )
      .bind(user.id, url, name)
      .run();
  } else {
    await c.env.DB.prepare("DELETE FROM user_feeds WHERE user_id = ? AND feed_url = ?")
      .bind(user.id, url)
      .run();
  }
  return c.json({ ok: true });
});

adminRoutes.post("/admin/feeds/preview", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ ok: false, error: "url required" }, 400);

  let candidateUrl = url.trim();
  if (!/^https?:\/\//i.test(candidateUrl)) {
    candidateUrl = "https://" + candidateUrl;
  }

  try {
    const xml = await fetchFeedXml(candidateUrl);
    const name = extractChannelTitle(xml);
    return c.json({ ok: true, url: candidateUrl, name });
  } catch (err) {
    return c.json({ ok: false, error: err instanceof Error ? err.message : "Fetch failed" }, 200);
  }
});

adminRoutes.post("/admin/feeds/add", async (c) => {
  const user = c.get("user");
  const { url, name } = await c.req.json<{ url: string; name: string }>();
  if (!url) return c.json({ error: "url required" }, 400);

  await c.env.DB.prepare(
    "INSERT INTO user_feeds (user_id, feed_url, feed_name) VALUES (?, ?, ?) ON CONFLICT (user_id, feed_url) DO UPDATE SET feed_name = excluded.feed_name"
  )
    .bind(user.id, url, name || url)
    .run();

  const ingestResult = await upsertArticlesForFeed(c.env, url);

  return c.json({ ok: true, articleCount: ingestResult.articleCount, fetchFailed: !ingestResult.ok });
});

adminRoutes.post("/admin/feeds/remove", async (c) => {
  const user = c.get("user");
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ error: "url required" }, 400);

  await c.env.DB.prepare("DELETE FROM user_feeds WHERE user_id = ? AND feed_url = ?")
    .bind(user.id, url)
    .run();

  return c.json({ ok: true });
});
