// Fallback image extraction: fetch the article's actual page and read its
// Open Graph image meta tag. Used only when RSS itself has no usable image.

const FETCH_TIMEOUT_MS = 5000;

function matchOgImage(html: string): string | null {
  // property before content: <meta property="og:image" content="...">
  const propFirst = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (propFirst) return propFirst[1];
  // content before property: <meta content="..." property="og:image">
  const contentFirst = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (contentFirst) return contentFirst[1];
  return null;
}

export async function fetchOgImage(articleUrl: string): Promise<string | null> {
  try {
    const res = await fetch(articleUrl, {
      headers: { "User-Agent": "SurikataRSSReader/1.0" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return matchOgImage(html);
  } catch {
    return null;
  }
}
