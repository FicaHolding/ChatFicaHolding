export interface Message {
  id: string;
  user_id: string;
  user_email: string;
  content: string;
  file_url?: string | null;
  file_type?: string | null; // 'image' | 'file'
  created_at: string;
}
