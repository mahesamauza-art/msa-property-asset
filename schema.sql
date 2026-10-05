CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  area TEXT,
  category TEXT,
  plant TEXT,
  year TEXT,
  land TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  nego INTEGER NOT NULL DEFAULT 1,
  complete TEXT,
  minus TEXT,
  description TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);

CREATE TABLE IF NOT EXISTS team_whatsapp (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS owner_submissions (
  id TEXT PRIMARY KEY,
  asset_name TEXT NOT NULL,
  location TEXT,
  whatsapp TEXT,
  description TEXT,
  owner_authorized INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Menunggu Konfirmasi Pemilik',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
