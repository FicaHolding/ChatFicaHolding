export interface Message {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string | null;
  content: string;
  file_url?: string | null;
  file_type?: string | null; // 'image' | 'file'
  room_id?: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_by: string; // Email Trưởng nhóm (Admin lập phòng)
  isPrivate?: boolean;
  vice_admins?: string[]; // Danh sách Email Phó nhóm
  allowed_emails?: string[]; // Danh sách Email thành viên trong nhóm
}

export interface RoomMember {
  id?: string;
  room_id: string;
  user_email: string;
  role: 'owner' | 'vice_admin' | 'member'; // 'owner': Trưởng nhóm, 'vice_admin': Phó nhóm, 'member': Thành viên
  created_at?: string;
}
