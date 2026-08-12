export interface Message {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string | null;
  user_avatar?: string | null;
  content: string;
  file_url?: string | null;
  file_type?: string | null; // 'image' | 'file'
  room_id?: string;
  reply_to?: {
    id: string;
    user_name: string;
    content: string;
  } | null;
  reactions?: { [emoji: string]: string[] }; // Map emoji string to array of user emails
  created_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_by: string; // Email người tạo
  isPrivate?: boolean;
  isDirect?: boolean; // true nếu là chat riêng 1-1
  direct_user_email?: string; // Email người bạn trong chat riêng 1-1
  vice_admins?: string[]; // Danh sách Email Phó nhóm
  allowed_emails?: string[]; // Danh sách Email thành viên trong nhóm
  pinned?: boolean;
  avatar_url?: string;
}

export interface RoomMember {
  id?: string;
  room_id: string;
  user_email: string;
  role: 'owner' | 'vice_admin' | 'member';
  created_at?: string;
}

export interface Friend {
  email: string;
  name: string;
  avatar_url?: string;
}
