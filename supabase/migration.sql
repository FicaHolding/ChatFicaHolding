ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS room_id TEXT DEFAULT 'general';
