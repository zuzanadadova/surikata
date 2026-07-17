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
  { name: "iRozhlas — Komentáře", url: "https://www.irozhlas.cz/rss/irozhlas/section/komentare" },
  { name: "iRozhlas — Kultura", url: "https://www.irozhlas.cz/rss/irozhlas/section/kultura" },
  { name: "iRozhlas — Svět", url: "https://www.irozhlas.cz/rss/irozhlas/section/zpravy-svet" },
  { name: "iRozhlas — Domov", url: "https://www.irozhlas.cz/rss/irozhlas/section/zpravy-domov" },
  { name: "iRozhlas — Vše", url: "https://www.irozhlas.cz/rss/irozhlas" },
  { name: "Deník N", url: "https://denikn.cz/feed" },
  { name: "Denník N", url: "https://dennikn.sk/feed" },
  { name: "The Guardian — World", url: "https://www.theguardian.com/world/rss" },
  { name: "The Guardian — Culture", url: "https://www.theguardian.com/uk/culture/rss" },
  { name: "The Guardian — Books", url: "https://www.theguardian.com/books/rss" },
  { name: "The Guardian — Film", url: "https://www.theguardian.com/film/rss" },
  { name: "Kapitál", url: "https://kapital-noviny.sk/feed" },
] as const;
