CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  vice_admins TEXT[] DEFAULT '{}',
  allowed_emails TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cho phap user xem chat_rooms" ON public.chat_rooms;
CREATE POLICY "Cho phap user xem chat_rooms" ON public.chat_rooms FOR ALL TO authenticated USING (true);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS room_id TEXT;
