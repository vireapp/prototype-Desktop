-- Gamification Schema Changes
-- This script adds gamification features (XP, Levels, Streaks, Quests, Achievements)

-- Add Gamification columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_xp_award timestamptz,
ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_saves integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_login_date date,
ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL, -- Lucide icon name or emoji
  tier text NOT NULL DEFAULT 'bronze', -- bronze, silver, gold, platinum
  xp_reward integer NOT NULL,
  coin_reward integer DEFAULT 0,
  criteria jsonb NOT NULL, -- Store criteria like {"type": "login_streak", "count": 7}
  created_at timestamptz DEFAULT now()
);

-- Seed some achievements
INSERT INTO achievements (name, description, icon, tier, xp_reward, coin_reward, criteria)
VALUES 
('Early Bird', 'Login to the app for the first time.', 'Sunrise', 'bronze', 50, 10, '{"type": "one_time"}'),
('Social Butterfly', 'Join 5 voice rooms.', 'Users', 'bronze', 100, 20, '{"type": "join_room", "count": 5}'),
('Social Butterfly II', 'Join 20 voice rooms.', 'Users', 'silver', 250, 50, '{"type": "join_room", "count": 20}'),
('Social Butterfly III', 'Join 50 voice rooms.', 'Users', 'gold', 500, 150, '{"type": "join_room", "count": 50}'),
('Night Owl', 'Stay active after midnight.', 'Moon', 'bronze', 75, 15, '{"type": "time", "hour": 0}'),
('Streak Master', 'Achieve a 7-day login streak.', 'Flame', 'silver', 300, 100, '{"type": "login_streak", "count": 7}');

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Daily Quests definition table
CREATE TABLE IF NOT EXISTS daily_quests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL DEFAULT 'easy', -- easy, medium, hard
  xp_reward integer NOT NULL,
  coin_reward integer NOT NULL,
  criteria jsonb NOT NULL,
  is_active boolean DEFAULT true
);

-- Seed some daily quests
INSERT INTO daily_quests (name, description, difficulty, xp_reward, coin_reward, criteria)
VALUES
('Say Hello', 'Send 5 messages in any room', 'easy', 50, 10, '{"type": "send_messages", "count": 5}'),
('Socializer', 'Join a voice room', 'easy', 50, 10, '{"type": "join_room", "count": 1}'),
('Chatterbox', 'Send 50 messages', 'medium', 100, 30, '{"type": "send_messages", "count": 50}'),
('Active Member', 'Stay active for 1 hour', 'hard', 200, 50, '{"type": "presence_time", "minutes": 60}');


-- User's Daily Quests progress
CREATE TABLE IF NOT EXISTS user_quests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid REFERENCES daily_quests(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  assigned_date date DEFAULT current_date,
  UNIQUE(user_id, quest_id, assigned_date)
);


-- Active Sessions / Activity Log to prevent XP spam
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'login', 'presence_tick'
  metadata jsonb, -- For storing extra context
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view achievements" ON achievements FOR SELECT USING (true);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active quests" ON daily_quests FOR SELECT USING (is_active = true);

ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own quests" ON user_quests FOR ALL USING (auth.uid() = user_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
