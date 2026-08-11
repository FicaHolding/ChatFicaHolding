-- ========================================================
-- SUPABASE DATABASE & STORAGE SCHEMA CHO UNG DUNG CHAT FICA
-- Thuc thi script nay trong SQL Editor cua Supabase Dashboard
-- ========================================================

-- 1. Tao bang messages de luu tru tin nhan
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_type TEXT, -- 'image' hoac 'file'
  room_id TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Dam bao cot user_email & room_id luon ton tai ke ca khi bang messages da duoc tao tu truoc
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS room_id TEXT DEFAULT 'general';

-- 2. Bat Row Level Security (RLS) cho bang messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Dynamic drop policy neu da ton tai de tranh loi khi rerun
DROP POLICY IF EXISTS "Cho phap user da dang nhap xem tin nhan" ON public.messages;
DROP POLICY IF EXISTS "Cho phap user da dang nhap gui tin nhan" ON public.messages;

-- Policy: Cho phap tat ca nguoi dung da auth doc tin nhan
CREATE POLICY "Cho phap user da dang nhap xem tin nhan"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Cho phap nguoi dung da auth gui tin nhan cua chinh minh
CREATE POLICY "Cho phap user da dang nhap gui tin nhan"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Kich hoat Supabase Realtime cho bang messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 4. Tao Storage Bucket "chat-attachments" de luu hinh anh & file
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy Storage: Cho phap xem/tave file
DROP POLICY IF EXISTS "Public Select Chat Attachments" ON storage.objects;
CREATE POLICY "Public Select Chat Attachments"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'chat-attachments');

-- Policy Storage: Cho phap authenticated user upload file
DROP POLICY IF EXISTS "Authenticated Upload Chat Attachments" ON storage.objects;
CREATE POLICY "Authenticated Upload Chat Attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments');
