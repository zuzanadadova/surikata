// Given an arbitrary website URL, fetch its HTML and look for
// <link rel="alternate" type="application/rss+xml|atom+xml" href="..."> tags.

export interface DiscoveredFeed {
  url: string;
  title: string | null;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

export async function discoverFeeds(pageUrl: string): Promise<DiscoveredFeed[]> {
  let res: Response;
  try {
    res = await fetch(pageUrl, { headers: { "User-Agent": "SurikataRSSReader/1.0" } });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("html")) return [];

  const html = await res.text();
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  const feeds: DiscoveredFeed[] = [];

  for (const tag of linkTags) {
    const relMatch = tag.match(/rel=["']([^"']+)["']/i);
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    const titleMatch = tag.match(/title=["']([^"']+)["']/i);

    if (!relMatch || !hrefMatch) continue;
    if (!/alternate/i.test(relMatch[1])) continue;

    const type = typeMatch?.[1] || "";
    if (!/rss\+xml|atom\+xml/i.test(type)) continue;

    feeds.push({
      url: resolveUrl(hrefMatch[1], pageUrl),
      title: titleMatch ? titleMatch[1] : null,
    });
  }

  // Dedupe by URL
  const seen = new Set<string>();
  return feeds.filter((f) => {
    if (seen.has(f.url)) return false;
    seen.add(f.url);
    return true;
  });
}

// Heuristic: does this string look like a direct feed URL rather than a webpage?
export function looksLikeFeedUrl(url: string): boolean {
  return /\/(feed|rss|atom)(\.xml)?\/?$|\.(rss|xml|atom)(\?.*)?$/i.test(url);
}
