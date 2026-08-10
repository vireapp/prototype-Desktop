-- =========================================================
-- user_sessions: track real login sessions per device
-- Run this in Supabase SQL Editor
-- =========================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL UNIQUE,   -- stable per-device UUID (from localStorage)
  device_name text,                     -- e.g. "Chrome on Windows PC"
  device_type text DEFAULT 'desktop',   -- 'desktop' | 'mobile' | 'tablet'
  ip_address text,                      -- populated server-side if available
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT false,
  is_blocked boolean DEFAULT false      -- owner-blocked devices are auto signed-out on login
);

-- Migration for existing databases (run in Supabase SQL Editor):
-- ALTER TABLE user_sessions ADD CONSTRAINT uq_session_token UNIQUE (session_token);
-- ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own session on login
CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions (e.g. update last_active)
CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sessions (sign-out specific device)
CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);
