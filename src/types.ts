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
] as const;
