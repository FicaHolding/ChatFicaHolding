ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS room_id TEXT DEFAULT 'general';

CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_room_user UNIQUE(room_id, user_email)
);

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phap user xem danh sach thanh vien phong" ON public.room_members;
CREATE POLICY "Cho phap user xem danh sach thanh vien phong"
  ON public.room_members
  FOR ALL
  TO authenticated
  USING (true);
