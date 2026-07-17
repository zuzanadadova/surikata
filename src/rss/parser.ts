// Minimal RSS 2.0 / Atom XML parser using regex-based extraction.
// Cloudflare Workers has no DOMParser for XML, so we parse with targeted regexes
// rather than pulling in a heavy XML library.

export interface ParsedArticle {
  link: string;
  title: string;
  perex: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
}

const PEREX_MAX_LENGTH = 200;

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&");
}

function stripCdata(text: string): string {
  const match = text.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return match ? match[1] : text;
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = block.match(re);
  if (!match) return null;
  return decodeEntities(stripCdata(match[1]).trim());
}

function extractAttr(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*/?>`, "i");
  const match = block.match(re);
  return match ? match[1] : null;
}

function extractAllTags(block: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?/?>`, "gi");
  return block.match(re) || [];
}

function normalizeDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function truncatePerex(text: string | null): string | null {
  if (!text) return null;
  const clean = stripHtmlTags(text).replace(/\s+/g, " ").trim();
  if (clean.length <= PEREX_MAX_LENGTH) return clean;
  return clean.slice(0, PEREX_MAX_LENGTH).trim() + "…";
}

const TARGET_MEDIA_WIDTH = 460;

function pickMediumMediaContent(block: string): string | null {
  const tags = extractAllTags(block, "media:content");
  if (tags.length === 0) return null;

  let best: { url: string; width: number | null } | null = null;
  for (const tag of tags) {
    const urlMatch = tag.match(/url=["']([^"']+)["']/i);
    if (!urlMatch) continue;
    const widthMatch = tag.match(/width=["']?(\d+)["']?/i);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
    const candidate = { url: urlMatch[1], width };
    if (best === null) {
      best = candidate;
      continue;
    }
    if (width === null) continue; // prefer entries with known width
    if (best.width === null || Math.abs(width - TARGET_MEDIA_WIDTH) < Math.abs(best.width - TARGET_MEDIA_WIDTH)) {
      best = candidate;
    }
  }
  return best ? best.url : null;
}

function extractImage(block: string): string | null {
  // RSS <enclosure url="..." type="image/...">
  const enclosureUrl = extractAttr(block, "enclosure", "url");
  if (enclosureUrl && /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(enclosureUrl)) {
    return enclosureUrl;
  }
  const enclosureType = extractAttr(block, "enclosure", "type");
  if (enclosureUrl && enclosureType && enclosureType.startsWith("image/")) {
    return enclosureUrl;
  }
  // media:content (pick the width closest to TARGET_MEDIA_WIDTH)
  const mediaContent = pickMediumMediaContent(block);
  if (mediaContent) return mediaContent;
  // media:thumbnail
  const mediaThumb = extractAttr(block, "media:thumbnail", "url");
  if (mediaThumb) return mediaThumb;
  // <img> inside description/content:encoded (CDATA-unwrapped)
  const description = extractTag(block, "description");
  const contentEncoded = extractTag(block, "content:encoded");
  for (const text of [description, contentEncoded]) {
    if (!text) continue;
    const imgMatch = text.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];
  }
  return null;
}

function isAtom(xml: string): boolean {
  return /<feed[\s>]/i.test(xml) && /xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/i.test(xml);
}

function parseRssItems(xml: string): ParsedArticle[] {
  const items: ParsedArticle[] = [];
  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const block of itemBlocks) {
    const link = extractTag(block, "link");
    const title = extractTag(block, "title");
    if (!link || !title) continue;
    const description = extractTag(block, "description") || extractTag(block, "content:encoded");
    items.push({
      link: link.trim(),
      title,
      perex: truncatePerex(description),
      imageUrl: extractImage(block),
      publishedAt: normalizeDate(extractTag(block, "pubDate") || extractTag(block, "dc:date")),
    });
  }
  return items;
}

function parseAtomEntries(xml: string): ParsedArticle[] {
  const items: ParsedArticle[] = [];
  const entryBlocks = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const block of entryBlocks) {
    let link = extractAttr(block, "link", "href");
    if (!link) link = extractTag(block, "link");
    const title = extractTag(block, "title");
    if (!link || !title) continue;
    const summary = extractTag(block, "summary") || extractTag(block, "content");
    items.push({
      link: link.trim(),
      title,
      perex: truncatePerex(summary),
      imageUrl: extractImage(block),
      publishedAt: normalizeDate(extractTag(block, "published") || extractTag(block, "updated")),
    });
  }
  return items;
}

export function parseFeed(xml: string): ParsedArticle[] {
  try {
    return isAtom(xml) ? parseAtomEntries(xml) : parseRssItems(xml);
  } catch {
    return [];
  }
}

export async function fetchAndParseFeed(feedUrl: string): Promise<ParsedArticle[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "SurikataRSSReader/1.0" },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseFeed(xml);
}
