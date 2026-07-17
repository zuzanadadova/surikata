-- Surikata database schema (SQLite / Cloudflare D1)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_feeds (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL,
  feed_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, feed_url)
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_url TEXT NOT NULL,
  link TEXT NOT NULL,
  title TEXT NOT NULL,
  perex TEXT,
  image_url TEXT,
  image_scrape_attempted INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (feed_url, link)
);

CREATE INDEX IF NOT EXISTS idx_articles_feed_url ON articles(feed_url);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);

CREATE TABLE IF NOT EXISTS read_articles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_link TEXT NOT NULL,
  read_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, article_link)
);

CREATE TABLE IF NOT EXISTS read_later (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_link TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  perex TEXT,
  image_url TEXT,
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, article_link)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_link TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT,
  perex TEXT,
  image_url TEXT,
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, article_link)
);
