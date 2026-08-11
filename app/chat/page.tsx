'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Message, ChatRoom, RoomMember } from '@/lib/types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import InstallPWA from '../components/InstallPWA';
import {
  Send,
  LogOut,
  Paperclip,
  Smile,
  X,
  FileText,
  MessageSquare,
  User,
  Download,
  Loader2,
  Key,
  CheckCircle2,
  Plus,
  Hash,
  Lock,
  Menu,
  ChevronRight,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

const COMMON_EMOJIS = ['😊', '😂', '😍', '👍', '🔥', '🎉', '❤️', '🙌', '😎', '🚀', '✨', '💯'];

const INITIAL_DEFAULT_ROOMS: ChatRoom[] = [
  { id: 'general', name: 'Phòng Chat Chung', isPrivate: false },
  { id: 'room_ke_toan', name: 'Phòng Kế Toán', isPrivate: true },
  { id: 'room_kinh_doanh', name: 'Phòng Kinh Doanh', isPrivate: true },
  { id: 'room_ky_thuat', name: 'Phòng Kỹ Thuật', isPrivate: true },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Rooms state (persisted in localStorage)
  const [rooms, setRooms] = useState<ChatRoom[]>(INITIAL_DEFAULT_ROOMS);
  const [activeRoom, setActiveRoom] = useState<ChatRoom>(INITIAL_DEFAULT_ROOMS[0]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Create new room modal
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Delete room confirm modal
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [deleteRoomLoading, setDeleteRoomLoading] = useState(false);

  // Member Management modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'file' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load custom rooms from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fica_chat_rooms');
      if (saved) {
        const parsed = JSON.parse(saved) as ChatRoom[];
        if (parsed.length > 0) {
          setRooms(parsed);
        }
      }
    } catch (e) {
      console.log('Error reading saved rooms:', e);
    }
  }, []);

  // Save custom rooms to localStorage
  const updateRoomsState = (newRooms: ChatRoom[]) => {
    setRooms(newRooms);
    try {
      localStorage.setItem('fica_chat_rooms', JSON.stringify(newRooms));
    } catch (e) {
      console.log('Error saving rooms:', e);
    }
  };

  // Helper to resolve a message's room_id with local fallback persistence
  const getMessageRoomId = (msg: Message): string => {
    if (msg.room_id) return msg.room_id;
    try {
      const localRoom = localStorage.getItem(`fica_msg_room_${msg.id}`);
      if (localRoom) return localRoom;
      const matchByContent = localStorage.getItem(`fica_msg_content_${encodeURIComponent(msg.content.substring(0, 30))}`);
      if (matchByContent) return matchByContent;
    } catch {
      // Fallback
    }
    return 'general';
  };

  // Smart deduplication helper matching IDs or User+Content+Timeframe
  const isSameMessage = (msgA: Message, msgB: Message): boolean => {
    if (msgA.id === msgB.id) return true;
    if (
      msgA.user_id === msgB.user_id &&
      msgA.content === msgB.content &&
      Math.abs(new Date(msgA.created_at).getTime() - new Date(msgB.created_at).getTime()) < 6000
    ) {
      return true;
    }
    return false;
  };

  // Initial load: User session & Fetch existing messages for activeRoom & Setup Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const initChat = async () => {
      setLoading(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      const name =
        currentUser.user_metadata?.full_name ||
        currentUser.email?.split('@')[0] ||
        'Thành viên Fica';
      setDisplayName(name);
      setEditNameInput(name);

      // Fetch messages for active room with robust room_id checking
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const filtered = (data as Message[]).filter((m) => {
          const roomOfMsg = getMessageRoomId(m);
          return roomOfMsg === activeRoom.id;
        });
        setMessages(filtered);
      } else {
        setMessages([]);
      }

      setLoading(false);

      // Setup Realtime channel for active room
      channel = supabase
        .channel(`room-${activeRoom.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMessage = payload.new as Message;
            const msgRoomId = getMessageRoomId(newMessage);

            if (msgRoomId === activeRoom.id) {
              setMessages((prev) => {
                const existingIndex = prev.findIndex((m) => isSameMessage(m, newMessage));
                if (existingIndex !== -1) {
                  const updated = [...prev];
                  updated[existingIndex] = { ...newMessage, room_id: msgRoomId };
                  return updated;
                }
                return [...prev, { ...newMessage, room_id: msgRoomId }];
              });
            }
          }
        )
        .subscribe();
    };

    initChat();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeRoom, router, supabase]);

  // Handle Display Name Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameInput.trim()) return;

    setProfileLoading(true);
    setProfileSuccess(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: editNameInput.trim() },
      });

      if (error) {
        alert('Lỗi cập nhật tên: ' + error.message);
      } else if (data.user) {
        setUser(data.user);
        setDisplayName(editNameInput.trim());
        setProfileSuccess('Đã cập nhật tên hiển thị thành công!');
        setTimeout(() => {
          setShowProfileModal(false);
          setProfileSuccess(null);
        }, 1500);
      }
    } catch {
      alert('Đã có lỗi xảy ra');
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch Room Members when members modal is opened
  const fetchRoomMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', activeRoom.id);

      if (!error && data && data.length > 0) {
        setRoomMembers(data as RoomMember[]);
      } else {
        setRoomMembers([
          {
            room_id: activeRoom.id,
            user_email: user?.email || 'fica.holding@gmail.com',
            role: 'admin',
          },
        ]);
      }
    } catch {
      setRoomMembers([
        {
          room_id: activeRoom.id,
          user_email: user?.email || 'fica.holding@gmail.com',
          role: 'admin',
        },
      ]);
    }
  };

  const handleOpenMembersModal = () => {
    setShowMembersModal(true);
    fetchRoomMembers();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    const emailToAdd = newMemberEmail.trim().toLowerCase();
    setMemberActionLoading(true);

    // Optimistically update UI local state instantly
    setRoomMembers((prev) => {
      if (prev.some((m) => m.user_email === emailToAdd)) return prev;
      return [...prev, { room_id: activeRoom.id, user_email: emailToAdd, role: 'member' }];
    });
    setNewMemberEmail('');

    try {
      await supabase.from('room_members').insert({
        room_id: activeRoom.id,
        user_email: emailToAdd,
        role: 'member',
      });
    } catch {
      // Safe fallback
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (emailToRemove: string) => {
    if (!confirm(`Bạn có chắc muốn mời ${emailToRemove} ra khỏi phòng?`)) return;

    setRoomMembers((prev) => prev.filter((m) => m.user_email !== emailToRemove));

    try {
      await supabase
        .from('room_members')
        .delete()
        .eq('room_id', activeRoom.id)
        .eq('user_email', emailToRemove);
    } catch {
      // Safe fallback
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const roomId = `room_${Date.now()}`;
    const newRoom: ChatRoom = {
      id: roomId,
      name: newRoomName.trim(),
      isPrivate: true,
    };

    const updated = [...rooms, newRoom];
    updateRoomsState(updated);
    setActiveRoom(newRoom);
    setNewRoomName('');
    setShowCreateRoomModal(false);
    setShowMobileSidebar(false);
  };

  // Handle Delete Chat Room (Admin action)
  const handleDeleteRoom = async () => {
    if (activeRoom.id === 'general') {
      alert('Không thể xóa Phòng Chat Chung mặc định!');
      return;
    }

    setDeleteRoomLoading(true);

    try {
      // Delete messages in this room from Supabase
      await supabase.from('messages').delete().eq('room_id', activeRoom.id);
      // Delete room members in this room from Supabase
      await supabase.from('room_members').delete().eq('room_id', activeRoom.id);
    } catch (e) {
      console.log('Error deleting room records on DB:', e);
    } finally {
      // Remove room from rooms array
      const filteredRooms = rooms.filter((r) => r.id !== activeRoom.id);
      updateRoomsState(filteredRooms);

      // Switch back to General Room
      const generalRoom = filteredRooms.find((r) => r.id === 'general') || INITIAL_DEFAULT_ROOMS[0];
      setActiveRoom(generalRoom);

      setDeleteRoomLoading(false);
      setShowDeleteRoomModal(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Nhập lại mật khẩu mới không khớp!');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess('Đổi mật khẩu thành công!');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(null);
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      setFileType('image');
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFileType('file');
      setFilePreview(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || sending || !user) return;

    setSending(true);
    let uploadedFileUrl: string | null = null;
    const uploadedFileType: 'image' | 'file' | null = fileType;
    const currentRoomId = activeRoom.id;
    const messageContent = inputText.trim();

    try {
      // Handle file upload if any
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Lỗi upload file:', uploadError);
          alert('Upload file thất bại! Hãy chắc chắn bucket "chat-attachments" đã được tạo.');
          setSending(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);

        uploadedFileUrl = publicUrlData.publicUrl;
      }

      // Optimistically add message to UI bound strictly to currentRoomId
      const tempId = `temp_${Date.now()}`;
      const newMsgObj: Message = {
        id: tempId,
        user_id: user.id,
        user_email: user.email || '',
        user_name: displayName,
        content: messageContent,
        file_url: uploadedFileUrl,
        file_type: uploadedFileType,
        room_id: currentRoomId,
        created_at: new Date().toISOString(),
      };

      // Save room binding locally to guarantee message never leaks to General Room
      try {
        localStorage.setItem(`fica_msg_room_${tempId}`, currentRoomId);
        if (messageContent) {
          localStorage.setItem(`fica_msg_content_${encodeURIComponent(messageContent.substring(0, 30))}`, currentRoomId);
        }
      } catch {
        // Ignore local storage errors
      }

      setMessages((prev) => {
        const existingIndex = prev.findIndex((m) => isSameMessage(m, newMsgObj));
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newMsgObj;
          return updated;
        }
        return [...prev, newMsgObj];
      });

      setInputText('');
      handleClearFile();

      // Insert message into Postgres DB with currentRoomId
      let { data: insertedData, error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: displayName,
          content: messageContent,
          file_url: uploadedFileUrl,
          file_type: uploadedFileType,
          room_id: currentRoomId,
        })
        .select();

      // If room_id or user_name column is missing on DB schema cache, retry with core schema
      if (
        insertError &&
        (insertError.message.includes('room_id') ||
          insertError.message.includes('user_name') ||
          insertError.message.includes('schema cache'))
      ) {
        const { data: retryData, error: retryError } = await supabase
          .from('messages')
          .insert({
            user_id: user.id,
            user_email: user.email,
            content: messageContent,
            file_url: uploadedFileUrl,
            file_type: uploadedFileType,
          })
          .select();

        insertedData = retryData;
        insertError = retryError;
      }

      // If DB insert returned created message ID, replace temporary ID and bind room in localStorage
      if (insertedData && insertedData[0]?.id) {
        const realId = insertedData[0].id;
        try {
          localStorage.setItem(`fica_msg_room_${realId}`, currentRoomId);
        } catch {
          // Ignore
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...insertedData[0], room_id: currentRoomId } : m))
        );
      }

      if (insertError) {
        console.error('Lỗi gửi tin nhắn:', insertError);
      }
    } catch (err: unknown) {
      console.error('Lỗi:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 max-w-7xl mx-auto w-full border-x border-slate-800 shadow-2xl overflow-hidden">
      {/* Sidebar - Rooms List */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          showMobileSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Fica Holding Chat</h2>
              <p className="text-[10px] text-slate-400">Danh sách phòng chat</p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Room Button */}
        <div className="p-3">
          <button
            onClick={() => setShowCreateRoomModal(true)}
            className="w-full py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo phòng chat mới</span>
          </button>
        </div>

        {/* Rooms Scroll List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Phòng trò chuyện ({rooms.length})
          </p>
          {rooms.map((room) => {
            const isActive = room.id === activeRoom.id;

            return (
              <button
                key={room.id}
                onClick={() => {
                  setActiveRoom(room);
                  setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {room.isPrivate ? (
                    <Lock className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                  ) : (
                    <Hash className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                  <span className="truncate">{room.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
              </button>
            );
          })}
        </div>

        {/* User Info Bottom Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2.5 text-left min-w-0 flex-1 hover:opacity-80 transition"
            title="Đổi tên hiển thị"
          >
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg shrink-0 border border-indigo-500/30">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950">
        {/* Main Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              {activeRoom.isPrivate ? (
                <Lock className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>{activeRoom.name}</span>
                {activeRoom.isPrivate && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    Phòng riêng
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Realtime Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Delete Room Button (Visible for non-general rooms) */}
            {activeRoom.id !== 'general' && (
              <button
                onClick={() => setShowDeleteRoomModal(true)}
                className="p-2 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
                title="Xóa phòng chat này (Dành cho Admin)"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">Xóa phòng</span>
              </button>
            )}

            {/* Admin Member Management Button */}
            <button
              onClick={handleOpenMembersModal}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-slate-700"
              title="Quản lý thành viên & Admin"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Thành viên</span>
            </button>

            {/* Change Password Button */}
            <button
              onClick={() => {
                setShowPasswordModal(true);
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-slate-700"
              title="Thay đổi mật khẩu"
            >
              <Key className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Đổi mật khẩu</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* PWA Mobile Install Banner */}
        <InstallPWA />

        {/* Messages Feed */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span className="text-xs">Đang tải tin nhắn {activeRoom.name}...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
              <MessageSquare className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-400">
                Chưa có tin nhắn nào trong {activeRoom.name}.
              </p>
              <p className="text-xs text-slate-600">Hãy bắt đầu cuộc trò chuyện ngay!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              const senderDisplayName = msg.user_name || msg.user_email?.split('@')[0] || msg.user_email;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <span className="text-[11px] text-slate-400 px-1">
                    <strong className="font-semibold text-slate-300">{isMe ? 'Bạn' : senderDisplayName}</strong>{' '}
                    <span className="text-slate-500">({msg.user_email})</span> •{' '}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-md space-y-2 ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none'
                    }`}
                  >
                    {/* Attached Image */}
                    {msg.file_url && msg.file_type === 'image' && (
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.file_url}
                          alt="Đính kèm"
                          className="max-h-64 max-w-full object-cover rounded-xl hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Attached File */}
                    {msg.file_url && msg.file_type === 'file' && (
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 bg-black/20 rounded-xl hover:bg-black/30 transition border border-white/10"
                      >
                        <FileText className="w-6 h-6 text-indigo-300 shrink-0" />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-medium truncate text-white">Tải về file đính kèm</p>
                          <p className="text-[10px] opacity-75">Bấm để mở / download</p>
                        </div>
                        <Download className="w-4 h-4 shrink-0 opacity-80" />
                      </a>
                    )}

                    {/* Text Content */}
                    {msg.content && (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Selected Attachment Preview */}
        {selectedFile && (
          <div className="px-6 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fileType === 'image' && filePreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                />
              ) : (
                <div className="p-2.5 bg-slate-800 rounded-lg text-indigo-400 border border-slate-700">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="text-xs">
                <p className="font-medium text-slate-200 max-w-[200px] sm:max-w-[300px] truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <button
              onClick={handleClearFile}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Emoji Picker Popover */}
        {showEmoji && (
          <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 shrink-0 font-medium">Emoji nhanh:</span>
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-xl p-1.5 hover:bg-slate-800 rounded-lg transition shrink-0 hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <footer className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* File Upload Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.zip,.txt"
            />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition"
                title="Đính kèm file hoặc hình ảnh"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmoji((prev) => !prev)}
                className={`p-2.5 rounded-xl transition ${
                  showEmoji
                    ? 'text-indigo-400 bg-indigo-600/20'
                    : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                }`}
                title="Chọn Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Gửi tin nhắn vào ${activeRoom.name}...`}
              className="flex-1 px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />

            <button
              type="submit"
              disabled={sending || (!inputText.trim() && !selectedFile)}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </footer>
      </div>

      {/* Delete Room Confirmation Modal */}
      {showDeleteRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowDeleteRoomModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 text-red-400">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Xác nhận xóa phòng chat</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa <strong className="text-white">{activeRoom.name}</strong>? Tất cả tin nhắn và dữ liệu thành viên trong phòng này sẽ bị xóa hoàn toàn.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteRoomModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={deleteRoomLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-red-600/30 transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleteRoomLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa phòng này</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile / Display Name Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Đổi Tên hiển thị</h3>
                <p className="text-xs text-slate-400">Đặt tên hiển thị thay cho email dài ngoẵng</p>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Email tài khoản
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Họ và tên / Tên hiển thị mới
                </label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A, Sếp Hùng..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {profileLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Lưu tên hiển thị</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowMembersModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Quản lý {activeRoom.name}</h3>
                <p className="text-xs text-slate-400">Thêm / Xóa thành viên được phép vào phòng</p>
              </div>
            </div>

            {/* Add Member Input Form */}
            <form onSubmit={handleAddMember} className="flex gap-2 mb-5">
              <input
                type="email"
                required
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Nhập email thành viên..."
                className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={memberActionLoading}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </form>

            {/* Members List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Danh sách thành viên ({roomMembers.length})
              </p>

              {roomMembers.map((member, index) => {
                const isAdmin = member.role === 'admin' || member.user_email === user?.email;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-slate-200 truncate">{member.user_email}</span>
                      {isAdmin && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>

                    {!isAdmin && (
                      <button
                        onClick={() => handleRemoveMember(member.user_email)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition"
                        title="Mời ra khỏi phòng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create New Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowCreateRoomModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Tạo phòng chat riêng</h3>
                <p className="text-xs text-slate-400">Tạo không gian trò chuyện riêng cho nhóm/phòng ban</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Tên phòng chat
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Ví dụ: Team Dự Án A, Phòng Sản Xuất..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo phòng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Thay đổi mật khẩu</h3>
                <p className="text-xs text-slate-400">Cập nhật mật khẩu mới cho tài khoản</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Nhập lại mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Cập nhật mật khẩu</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
