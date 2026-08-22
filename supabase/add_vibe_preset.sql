-- Add vibe_preset to duo_rooms table
ALTER TABLE duo_rooms ADD COLUMN IF NOT EXISTS vibe_preset text DEFAULT NULL;
