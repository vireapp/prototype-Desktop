-- Add columns to friends table for enhanced features
ALTER TABLE friends 
ADD COLUMN IF NOT EXISTS nickname text,
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_muted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_my_status boolean DEFAULT false;

-- Create reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_reports
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can can insert their own reports
CREATE POLICY "Users can create reports" ON user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  
-- Policy: Only admins can view reports (omitted for now, or just restrictive)
-- For now, no select policy means only database admins/supa can see.
-- Add XP and Level to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_xp_award timestamptz;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL, -- Lucide icon name or emoji
  xp_reward integer NOT NULL,
  criteria jsonb NOT NULL, -- Store criteria like {"type": "login_streak", "count": 7}
  created_at timestamptz DEFAULT now()
);

-- Seed some achievements
INSERT INTO achievements (name, description, icon, xp_reward, criteria)
VALUES 
('Early Bird', 'Login to the app for the first time.', 'Sunrise', 50, '{"type": "one_time"}'),
('Social Butterfly', 'Join 5 voice rooms.', 'Users', 100, '{"type": "join_room", "count": 5}'),
('Night Owl', 'Stay active after midnight.', 'Moon', 75, '{"type": "time", "hour": 0}');

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Active Sessions / Activity Log to prevent XP spam
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'login', 'presence_tick'
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT USING (true);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
