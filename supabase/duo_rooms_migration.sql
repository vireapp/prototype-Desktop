-- ─── duo_queue table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duo_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gender TEXT CHECK (gender IN ('M', 'F', 'other')) NOT NULL,
  match_pref TEXT CHECK (match_pref IN ('M', 'F', 'any')) NOT NULL DEFAULT 'any',
  interests TEXT[] DEFAULT '{}',
  hobbies TEXT[] DEFAULT '{}',
  likes TEXT DEFAULT '',
  dislikes TEXT DEFAULT '',
  room_type TEXT CHECK (room_type IN ('romantic', 'friends', 'family')) NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'matched', 'expired')) NOT NULL DEFAULT 'waiting',
  matched_with UUID REFERENCES auth.users(id),
  match_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── duo_rooms table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duo_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_type TEXT CHECK (room_type IN ('romantic', 'friends', 'family')) NOT NULL,
  match_score INTEGER DEFAULT 0,
  chat_unlocked BOOLEAN DEFAULT TRUE,
  voice_unlocked BOOLEAN DEFAULT FALSE,
  video_unlocked BOOLEAN DEFAULT FALSE,
  extras_unlocked BOOLEAN DEFAULT FALSE,
  chat_message_count INTEGER DEFAULT 0,
  call_count INTEGER DEFAULT 0,
  voice_unlock_at INTEGER DEFAULT 50,
  video_unlock_at INTEGER DEFAULT 3,
  extras_unlock_at INTEGER DEFAULT 1,
  room_named BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── duo_icebreaker_answers table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duo_icebreaker_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duo_room_id UUID REFERENCES duo_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(duo_room_id, user_id)
);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE duo_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE duo_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE duo_icebreaker_answers ENABLE ROW LEVEL SECURITY;

-- duo_queue: users can see waiting entries for matching + own entries
CREATE POLICY "Read waiting entries for matching" ON duo_queue
  FOR SELECT USING (status = 'waiting' OR user_id = auth.uid());

CREATE POLICY "Insert own queue entry" ON duo_queue
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own queue entry" ON duo_queue
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Delete own queue entry" ON duo_queue
  FOR DELETE USING (user_id = auth.uid());

-- duo_rooms: both matched users can read and update
CREATE POLICY "Read own duo rooms" ON duo_rooms
  FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Insert duo rooms" ON duo_rooms
  FOR INSERT WITH CHECK (user1_id = auth.uid());

CREATE POLICY "Update duo rooms" ON duo_rooms
  FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- duo_icebreaker_answers: both users in the room can read, only own row to write
CREATE POLICY "Read icebreaker answers for duo room" ON duo_icebreaker_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM duo_rooms dr
      WHERE dr.id = duo_room_id
        AND (dr.user1_id = auth.uid() OR dr.user2_id = auth.uid())
    )
  );

CREATE POLICY "Insert own icebreaker answers" ON duo_icebreaker_answers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own icebreaker answers" ON duo_icebreaker_answers
  FOR UPDATE USING (user_id = auth.uid());
