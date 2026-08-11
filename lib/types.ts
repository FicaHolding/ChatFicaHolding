export interface Message {
  id: string;
  user_id: string;
  user_email: string;
  content: string;
  file_url?: string | null;
  file_type?: string | null; // 'image' | 'file'
  room_id?: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  isPrivate?: boolean;
}

export interface RoomMember {
  id?: string;
  room_id: string;
  user_email: string;
  role: 'admin' | 'member';
  created_at?: string;
}
