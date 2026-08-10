-- Revert Gamification Schema Changes
-- This script reverses changes made by schema_gamification.sql
-- Note: Running this will DELETE all gamification data (XP, Levels, Achievements)

-- 1. Drop Tables (and their policies/indexes/constraints)
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS activity_logs;

-- 2. Remove columns from profiles table
-- We use ALTER TABLE ... DROP COLUMN IF EXISTS to be safe
ALTER TABLE profiles 
DROP COLUMN IF EXISTS xp,
DROP COLUMN IF EXISTS level,
DROP COLUMN IF EXISTS last_xp_award;

-- Verification (Optional)
-- SELECT * FROM profiles LIMIT 1;
