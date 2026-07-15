import { Hono } from "hono";
import type { Env } from "../types";
import { PRESET_FEEDS } from "../types";
import { layout } from "../views/layout";
import { discoverFeeds, looksLikeFeedUrl } from "../rss/discover";

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

  const presetsHtml = PRESET_FEEDS.map(
    (f) => `
    <label class="flex items-center justify-between py-3 border-b border-gray-100">
      <span class="text-sm font-medium text-gray-900">${escapeHtml(f.name)}</span>
      <input type="checkbox" class="preset-toggle w-5 h-5 accent-gray-900" data-url="${escapeHtml(f.url)}" data-name="${escapeHtml(f.name)}" ${subscribedUrls.has(f.url) ? "checked" : ""} />
    </label>`
  ).join("");

  const customHtml = customFeeds
    .filter((f) => !PRESET_FEEDS.some((p) => p.url === f.feed_url))
    .map(
      (f) => `
    <div class="flex items-center justify-between py-3 border-b border-gray-100">
      <div class="min-w-0 pr-3">
        <div class="text-sm font-medium text-gray-900 truncate">${escapeHtml(f.feed_name)}</div>
        <div class="text-xs text-gray-400 truncate">${escapeHtml(f.feed_url)}</div>
      </div>
      <button type="button" class="remove-feed flex-shrink-0 text-red-500 text-sm" data-url="${escapeHtml(f.feed_url)}">Remove</button>
    </div>`
    )
    .join("");

  const body = `
    <div class="p-4 space-y-6">
      ${message ? `<div class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">${escapeHtml(message)}</div>` : ""}

      <section>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Preset Feeds</h2>
        <div class="bg-white rounded-xl border border-gray-200 px-4">${presetsHtml}</div>
      </section>

      <section>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Custom Feed</h2>
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <input id="custom-url" type="text" placeholder="Paste a website or RSS feed URL"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
          <button type="button" id="discover-btn" class="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Find Feed</button>
          <div id="discover-results" class="space-y-2"></div>
        </div>
      </section>

      <section>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Subscriptions</h2>
        <div class="bg-white rounded-xl border border-gray-200 px-4">
          ${customHtml || `<div class="text-sm text-gray-400 py-3">No custom feeds yet.</div>`}
        </div>
      </section>
    </div>
  `;

  return c.html(
    layout({
      title: "Manage Sources",
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

adminRoutes.post("/admin/feeds/discover", async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  if (!url) return c.json({ error: "url required" }, 400);

  let candidateUrl = url.trim();
  if (!/^https?:\/\//i.test(candidateUrl)) {
    candidateUrl = "https://" + candidateUrl;
  }

  if (looksLikeFeedUrl(candidateUrl)) {
    return c.json({ feeds: [{ url: candidateUrl, title: null }] });
  }

  const feeds = await discoverFeeds(candidateUrl);
  if (feeds.length === 0) {
    // Fall back: maybe it actually was a direct feed URL that didn't match the heuristic.
    return c.json({ feeds: [{ url: candidateUrl, title: null }], fallback: true });
  }
  return c.json({ feeds });
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

  return c.json({ ok: true });
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
