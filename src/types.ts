export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
}

export interface AuthedUser {
  id: number;
  username: string;
}

export interface ArticleRow {
  id: number;
  feed_url: string;
  link: string;
  title: string;
  perex: string | null;
  image_url: string | null;
  published_at: string | null;
  fetched_at: string;
}

export interface FeedRow {
  user_id: number;
  feed_url: string;
  feed_name: string;
  created_at: string;
}

export const PRESET_FEEDS = [
  { name: "Deník Alarm", url: "https://denikalarm.cz/feed" },
  { name: "Druhá směna", url: "https://druhasmena.cz/rss" },
  { name: "Page Not Found", url: "https://pagenotfound.cz/rss" },
  { name: "Vox Pot", url: "https://www.voxpot.cz/feed" },
  { name: "Deník Referendum", url: "https://denikreferendum.cz/rss.xml" },
  { name: "iRozhlas", url: "https://www.irozhlas.cz/rss/irozhlas" },
  { name: "Deník N", url: "https://denikn.cz/feed" },
  { name: "Denník N", url: "https://dennikn.sk/feed" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
  { name: "Kapitál", url: "https://kapital-noviny.sk/feed" },
  { name: "Respekt", url: "https://www.respekt.cz/api/rss" },
  { name: "El País", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/ultimas-noticias/portada" },
  { name: "ČT24", url: "https://ct24.ceskatelevize.cz/rss/hlavni-zpravy" },
  { name: "Seznam Zprávy", url: "https://www.seznamzpravy.cz/rss" },
  { name: "SME.sk", url: "https://rss.sme.sk/rss/rss.asp?id=frontpage" },
  { name: "Aktuality.sk", url: "https://www.aktuality.sk/rss/" },
  { name: "BBC World News", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "NY Times (World News)", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { name: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
] as const;
