-- Online Clipboard: board metadata table
-- Tracks board codes/names, type, settings, and timestamps for LRU recycling

CREATE TABLE IF NOT EXISTS clipboard_boards (
  id TEXT PRIMARY KEY,                -- 4-digit code (public) or custom name (private)
  type TEXT NOT NULL DEFAULT 'public', -- 'public' or 'private'
  language TEXT DEFAULT 'plaintext',
  has_password BOOLEAN DEFAULT false,
  password_hash TEXT,
  burn_after_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for finding the oldest public board (LRU recycling)
CREATE INDEX IF NOT EXISTS idx_clipboard_public_oldest
  ON clipboard_boards (updated_at ASC) WHERE type = 'public';

-- Index for quick code lookups
CREATE INDEX IF NOT EXISTS idx_clipboard_boards_type
  ON clipboard_boards (type);

-- RLS: allow all operations through the service role key (API handlers use service key)
ALTER TABLE clipboard_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON clipboard_boards
  FOR ALL USING (true) WITH CHECK (true);
