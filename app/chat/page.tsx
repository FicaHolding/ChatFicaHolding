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
  Lock,
  Menu,
  ChevronRight,
  Users,
  UserPlus,
  Trash2,
  Crown,
  Award,
  AlertTriangle,
  Search,
  Image as ImageIcon,
  Pin,
  PinOff,
  PanelRight,
  PanelRightClose,
  Video,
  Folder,
  Cloud,
  Contact2,
  HelpCircle,
  Settings,
  AtSign,
  ThumbsUp,
  CornerUpLeft,
  ChevronDown,
  Edit2,
  Bell,
  BellOff,
  Share2,
  MoreHorizontal,
  FileCode,
} from 'lucide-react';

const COMMON_EMOJIS = ['😊', '😂', '😍', '👍', '🔥', '🎉', '❤️', '🙌', '😎', '🚀', '✨', '💯'];
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const GLOBAL_SUPER_ADMIN = 'fica.holding@gmail.com';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Search & Filter Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');

  // Right Panel & Sidebar Toggles
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});

  // Reply & Mention States
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Rooms state (persisted in localStorage)
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);

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

  // Purge ALL stale room cache keys & initialize fresh clean rooms
  useEffect(() => {
    try {
      const userEmail = user?.email || GLOBAL_SUPER_ADMIN;

      // Purge all legacy cache keys
      const keysToPurge = [
        'fica_chat_rooms',
        'fica_chat_rooms_v2',
        'fica_chat_rooms_v3',
        'fica_chat_rooms_v4',
        'fica_chat_rooms_v5',
      ];
      keysToPurge.forEach((k) => localStorage.removeItem(k));

      const savedRooms = localStorage.getItem('fica_chat_rooms_v7');
      if (savedRooms) {
        const parsed = JSON.parse(savedRooms) as ChatRoom[];
        const cleanRooms = parsed
          .filter((r) => r.id !== 'general')
          .map((r) => ({
            ...r,
            created_by: r.created_by || userEmail,
            allowed_emails: r.allowed_emails || [userEmail],
          }));
        if (cleanRooms.length > 0) {
          setRooms(cleanRooms);
          return;
        }
      }

      // Default initial rooms for current logged in user
      const initialDefaultRooms: ChatRoom[] = [
        {
          id: 'room_ke_toan',
          name: 'HOLDING SHK - KẾ TOÁN',
          created_by: userEmail,
          isPrivate: true,
          vice_admins: [],
          allowed_emails: [userEmail],
          pinned: true,
        },
        {
          id: 'room_kinh_doanh',
          name: 'Phòng Kinh Doanh',
          created_by: userEmail,
          isPrivate: true,
          vice_admins: [],
          allowed_emails: [userEmail],
        },
        {
          id: 'room_ky_thuat',
          name: 'Thanh niên quậy - quẩy eco',
          created_by: userEmail,
          isPrivate: true,
          vice_admins: [],
          allowed_emails: [userEmail],
        },
      ];

      setRooms(initialDefaultRooms);
      localStorage.setItem('fica_chat_rooms_v7', JSON.stringify(initialDefaultRooms));
    } catch (e) {
      console.log('Error initializing clean rooms:', e);
    }
  }, [user]);

  // Save custom rooms state to localStorage
  const updateRoomsState = (newRooms: ChatRoom[]) => {
    const cleanRooms = newRooms.filter((r) => r.id !== 'general');
    setRooms(cleanRooms);
    try {
      localStorage.setItem('fica_chat_rooms_v7', JSON.stringify(cleanRooms));
    } catch (e) {
      console.log('Error saving rooms:', e);
    }
  };

  // Helper check: Is user Room Creator / Admin (Trưởng nhóm)?
  const isRoomOwner = (room: ChatRoom | null, email?: string | null): boolean => {
    if (!room || !email) return false;
    const userEmail = email.toLowerCase().trim();
    if (!room.created_by) return true;
    return room.created_by.toLowerCase().trim() === userEmail;
  };

  // Helper check: Is user Vice Admin (Phó nhóm)?
  const isViceAdmin = (room: ChatRoom | null, email?: string | null): boolean => {
    if (!room || !email) return false;
    const userEmail = email.toLowerCase().trim();
    if (isRoomOwner(room, userEmail)) return false;
    const viceList = room.vice_admins || [];
    return viceList.some((v) => v.toLowerCase().trim() === userEmail);
  };

  // Strict check if a user can see and enter a specific room
  const canUserAccessRoom = (room: ChatRoom, userEmail?: string | null): boolean => {
    if (!userEmail || room.id === 'general') return false;
    const email = userEmail.toLowerCase().trim();

    if (room.created_by && room.created_by.toLowerCase().trim() === email) return true;
    if ((room.vice_admins || []).some((v) => v.toLowerCase().trim() === email)) return true;
    if ((room.allowed_emails || []).some((e) => e.toLowerCase().trim() === email)) return true;

    return false;
  };

  // Filter rooms visible to current user
  const visibleRooms = rooms
    .filter((r) => canUserAccessRoom(r, user?.email))
    .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Set default active room based on user access
  useEffect(() => {
    if (user && visibleRooms.length > 0) {
      if (!activeRoom || !visibleRooms.some((r) => r.id === activeRoom.id)) {
        setActiveRoom(visibleRooms[0]);
      }
    } else if (visibleRooms.length === 0) {
      setActiveRoom(null);
    }
  }, [user, visibleRooms, activeRoom]);

  // Helper to resolve a message's room_id
  const getMessageRoomId = (msg: Message): string => {
    if (msg.room_id) return msg.room_id;
    try {
      const localRoom = localStorage.getItem(`fica_msg_room_${msg.id}`);
      if (localRoom) return localRoom;
      const matchByContent = localStorage.getItem(
        `fica_msg_content_${encodeURIComponent(msg.content.substring(0, 30))}`
      );
      if (matchByContent) return matchByContent;
    } catch {
      // Fallback
    }
    return '';
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

      if (!activeRoom) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Fetch messages for active room
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

            if (activeRoom && msgRoomId === activeRoom.id) {
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

  // Fetch Room Members list when member modal is opened
  const fetchRoomMembers = async () => {
    if (!activeRoom) return;

    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', activeRoom.id);

      if (!error && data && data.length > 0) {
        setRoomMembers(data as RoomMember[]);
      } else {
        const allowed = activeRoom.allowed_emails || [activeRoom.created_by];
        const defaultList: RoomMember[] = allowed.map((emailStr) => {
          let role: 'owner' | 'vice_admin' | 'member' = 'member';
          if (emailStr.toLowerCase() === activeRoom.created_by.toLowerCase()) role = 'owner';
          else if ((activeRoom.vice_admins || []).some((v) => v.toLowerCase() === emailStr.toLowerCase()))
            role = 'vice_admin';

          return {
            room_id: activeRoom.id,
            user_email: emailStr,
            role,
          };
        });

        setRoomMembers(defaultList);
      }
    } catch {
      setRoomMembers([
        {
          room_id: activeRoom.id,
          user_email: activeRoom.created_by,
          role: 'owner',
        },
      ]);
    }
  };

  const handleOpenMembersModal = () => {
    if (!activeRoom) return;
    setShowMembersModal(true);
    fetchRoomMembers();
  };

  // Add new member to room
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !activeRoom) return;

    const emailToAdd = newMemberEmail.trim().toLowerCase();
    setMemberActionLoading(true);

    const updatedRooms = rooms.map((r) => {
      if (r.id === activeRoom.id) {
        const existingAllowed = r.allowed_emails || [];
        if (!existingAllowed.includes(emailToAdd)) {
          return { ...r, allowed_emails: [...existingAllowed, emailToAdd] };
        }
      }
      return r;
    });

    updateRoomsState(updatedRooms);

    setRoomMembers((prev) => {
      if (prev.some((m) => m.user_email.toLowerCase() === emailToAdd)) return prev;
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

  // Assign or Remove Vice Admin (Phó Nhóm)
  const handleToggleViceAdmin = (targetEmail: string, currentRole: string) => {
    if (!activeRoom) return;

    const targetLower = targetEmail.toLowerCase();
    const isPromoting = currentRole !== 'vice_admin';

    const updatedRooms = rooms.map((r) => {
      if (r.id === activeRoom.id) {
        const currentVice = r.vice_admins || [];
        let newViceList: string[];
        if (isPromoting) {
          newViceList = [...currentVice, targetLower];
        } else {
          newViceList = currentVice.filter((v) => v.toLowerCase() !== targetLower);
        }
        return { ...r, vice_admins: newViceList };
      }
      return r;
    });

    updateRoomsState(updatedRooms);

    setRoomMembers((prev) =>
      prev.map((m) => {
        if (m.user_email.toLowerCase() === targetLower) {
          return { ...m, role: isPromoting ? 'vice_admin' : 'member' };
        }
        return m;
      })
    );
  };

  // Toggle Pin Room
  const handleTogglePinRoom = (roomId: string) => {
    const updated = rooms.map((r) => (r.id === roomId ? { ...r, pinned: !r.pinned } : r));
    updateRoomsState(updated);
  };

  // Remove member from group
  const handleRemoveMember = async (emailToRemove: string) => {
    if (!activeRoom) return;
    if (!confirm(`Bạn có chắc muốn mời ${emailToRemove} ra khỏi nhóm?`)) return;

    const targetLower = emailToRemove.toLowerCase();

    const updatedRooms = rooms.map((r) => {
      if (r.id === activeRoom.id) {
        return {
          ...r,
          allowed_emails: (r.allowed_emails || []).filter((e) => e.toLowerCase() !== targetLower),
          vice_admins: (r.vice_admins || []).filter((v) => v.toLowerCase() !== targetLower),
        };
      }
      return r;
    });

    updateRoomsState(updatedRooms);
    setRoomMembers((prev) => prev.filter((m) => m.user_email.toLowerCase() !== targetLower));

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

  // Toggle Reaction on a message
  const handleAddReaction = (msgId: string, emoji: string) => {
    if (!user) return;
    const userEmail = user.email || '';

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          const currentReactions = msg.reactions || {};
          const currentList = currentReactions[emoji] || [];
          const hasReacted = currentList.includes(userEmail);

          const newList = hasReacted
            ? currentList.filter((e) => e !== userEmail)
            : [...currentList, userEmail];

          return {
            ...msg,
            reactions: {
              ...currentReactions,
              [emoji]: newList,
            },
          };
        }
        return msg;
      })
    );
  };

  // Handle Input `@` Mentions Suggestion
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.endsWith('@')) {
      setShowMentionPopup(true);
    } else if (!val.includes('@')) {
      setShowMentionPopup(false);
    }
  };

  const handleSelectMention = (targetName: string) => {
    setInputText((prev) => {
      const lastAtIndex = prev.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        return prev.substring(0, lastAtIndex) + `@${targetName} `;
      }
      return prev + `@${targetName} `;
    });
    setShowMentionPopup(false);
  };

  // Create New Chat Room
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !user) return;

    const roomId = `room_${Date.now()}`;
    const creatorEmail = user.email || '';

    const newRoom: ChatRoom = {
      id: roomId,
      name: newRoomName.trim(),
      created_by: creatorEmail,
      isPrivate: true,
      vice_admins: [],
      allowed_emails: [creatorEmail],
    };

    const updated = [...rooms, newRoom];
    updateRoomsState(updated);
    setActiveRoom(newRoom);
    setNewRoomName('');
    setShowCreateRoomModal(false);
    setShowMobileSidebar(false);
  };

  // Handle Delete Chat Room / Disband Group
  const handleDeleteRoom = async () => {
    if (!activeRoom) return;

    setDeleteRoomLoading(true);

    try {
      await supabase.from('messages').delete().eq('room_id', activeRoom.id);
      await supabase.from('room_members').delete().eq('room_id', activeRoom.id);
    } catch (e) {
      console.log('Error deleting room records on DB:', e);
    } finally {
      const filteredRooms = rooms.filter((r) => r.id !== activeRoom.id);
      updateRoomsState(filteredRooms);

      const nextRoom = filteredRooms.find((r) => canUserAccessRoom(r, user?.email)) || null;
      setActiveRoom(nextRoom);

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

  // Quick Like 👍 Button
  const handleSendLike = () => {
    setInputText('👍');
    handleSendMessageDirect('👍');
  };

  const handleSendMessageDirect = async (overrideText?: string) => {
    const messageContent = (overrideText !== undefined ? overrideText : inputText).trim();
    if (!activeRoom || (!messageContent && !selectedFile) || sending || !user) return;

    setSending(true);
    let uploadedFileUrl: string | null = null;
    const uploadedFileType: 'image' | 'file' | null = fileType;
    const currentRoomId = activeRoom.id;

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Lỗi upload file:', uploadError);
          alert('Upload file thất bại!');
          setSending(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);

        uploadedFileUrl = publicUrlData.publicUrl;
      }

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
        reply_to: replyTarget
          ? {
              id: replyTarget.id,
              user_name: replyTarget.user_name || replyTarget.user_email,
              content: replyTarget.content,
            }
          : null,
        created_at: new Date().toISOString(),
      };

      try {
        localStorage.setItem(`fica_msg_room_${tempId}`, currentRoomId);
      } catch {
        // Ignore
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
      setReplyTarget(null);
      handleClearFile();

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

      if (insertError) {
        console.error('Lỗi gửi tin nhắn:', insertError);
      } else if (insertedData && insertedData[0]?.id) {
        const realId = insertedData[0].id;
        try {
          localStorage.setItem(`fica_msg_room_${realId}`, currentRoomId);
        } catch {
          // Ignore
        }
      }
    } catch (err: unknown) {
      console.error('Lỗi:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessageDirect();
  };

  // Helper to render mentions in blue text
  const renderMessageContent = (content: string) => {
    if (!content) return null;

    const parts = content.split(/(@[\w.À-ỹ]+|@All)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex h-screen bg-[#eef0f3] text-slate-800 max-w-[1600px] mx-auto w-full shadow-2xl overflow-hidden font-sans select-none">
      {/* ========================================================================= */}
      {/* COLUMN 1: LEFTMOST ICON NAV BAR (Zalo Dark Blue #001a33) */}
      {/* ========================================================================= */}
      <nav className="w-16 bg-[#001a33] flex flex-col items-center py-4 justify-between shrink-0 z-20">
        <div className="flex flex-col items-center gap-6">
          {/* User Avatar */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="relative group transition hover:scale-105"
            title="Tài khoản cá nhân"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white/80 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#001a33] rounded-full"></span>
          </button>

          {/* Navigation Items */}
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-blue-600 shadow-lg shadow-blue-600/30 transition"
              title="Tin nhắn"
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            <button
              onClick={handleOpenMembersModal}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-200/60 hover:text-white hover:bg-white/10 transition"
              title="Danh bạ / Thành viên"
            >
              <Contact2 className="w-6 h-6" />
            </button>

            <button
              className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-200/60 hover:text-white hover:bg-white/10 transition"
              title="Cloud của tôi"
            >
              <Cloud className="w-6 h-6" />
            </button>

            <button
              className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-200/60 hover:text-white hover:bg-white/10 transition"
              title="Quản lý File"
            >
              <Folder className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Bottom System Action Icons */}
        <div className="flex flex-col items-center gap-4 w-full">
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordError(null);
              setPasswordSuccess(null);
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-200/60 hover:text-white hover:bg-white/10 transition"
            title="Đổi mật khẩu / Cài đặt"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-blue-200/60 hover:text-red-400 hover:bg-white/10 transition"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* COLUMN 2: CHAT ROOMS LIST COLUMN (320px Width) */}
      {/* ========================================================================= */}
      <aside
        className={`w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-transform duration-300 md:static ${
          showMobileSidebar ? 'fixed inset-y-0 left-16 z-40 shadow-2xl' : 'hidden md:flex'
        }`}
      >
        {/* Top Search Bar & Actions */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setShowCreateRoomModal(true)}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            title="Tạo nhóm mới"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters: Tất cả | Chưa đọc */}
        <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilterTab('all')}
              className={`pb-1 border-b-2 transition ${
                filterTab === 'all'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`pb-1 border-b-2 transition ${
                filterTab === 'unread'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              Chưa đọc
            </button>
          </div>
          <button className="text-slate-400 hover:text-slate-600 text-[11px] flex items-center gap-1">
            <span>Phân loại</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Chat Rooms Scrollable Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {visibleRooms.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p>Chưa có cuộc trò chuyện nào.</p>
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="text-blue-600 font-semibold underline"
              >
                + Tạo nhóm mới ngay
              </button>
            </div>
          ) : (
            visibleRooms.map((room) => {
              const isActive = activeRoom && room.id === activeRoom.id;

              return (
                <div
                  key={room.id}
                  onClick={() => {
                    setActiveRoom(room);
                    setShowMobileSidebar(false);
                  }}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition relative group ${
                    isActive
                      ? 'bg-blue-50/80 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  {/* Group Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                    {room.pinned && (
                      <div className="absolute -top-1 -right-1 p-0.5 bg-slate-200 text-slate-600 rounded-full border border-white">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Room Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-blue-900 font-bold' : 'text-slate-800'
                        }`}
                      >
                        {room.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">10:45</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {room.allowed_emails && room.allowed_emails.length > 0
                        ? `${room.allowed_emails.length} thành viên`
                        : 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                  </div>

                  {/* Pin Room Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePinRoom(room.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition"
                    title={room.pinned ? 'Bỏ ghim' : 'Ghim hội thoại'}
                  >
                    {room.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* COLUMN 3: MAIN CHAT FEED WINDOW (Central Flex-1) */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col h-full bg-[#f4f5f7] min-w-0 border-r border-slate-200">
        {activeRoom ? (
          <>
            {/* Top Bar Header */}
            <header className="h-16 px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                  {activeRoom.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <span>{activeRoom.name}</span>
                    {isRoomOwner(activeRoom, user?.email) && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold border border-amber-300">
                        👑 Trưởng nhóm
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{(activeRoom.allowed_emails || []).length} thành viên</span>
                  </p>
                </div>
              </div>

              {/* Action Tools Header Icons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                  title="Thêm thành viên"
                  onClick={handleOpenMembersModal}
                >
                  <UserPlus className="w-5 h-5" />
                </button>

                <button
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                  title="Cuộc gọi thoại/video"
                >
                  <Video className="w-5 h-5" />
                </button>

                <button
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                  title="Tìm kiếm tin nhắn"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Right Panel Toggle Button */}
                <button
                  onClick={() => setShowRightPanel((prev) => !prev)}
                  className={`p-2 rounded-lg transition ${
                    showRightPanel
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                  }`}
                  title="Thông tin nhóm"
                >
                  <PanelRight className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* PWA Mobile Install Banner */}
            <InstallPWA />

            {/* Messages Feed Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Date Separator Pill */}
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-slate-200/80 text-slate-600 rounded-full text-[11px] font-semibold">
                  Hôm nay
                </span>
              </div>

              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-xs">Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
                  <MessageSquare className="w-12 h-12 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-600">Chưa có tin nhắn nào.</p>
                  <p className="text-xs text-slate-400">Hãy là người đầu tiên lên tiếng!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.user_id === user?.id;
                  const senderDisplayName =
                    msg.user_name || msg.user_email?.split('@')[0] || msg.user_email;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 group ${
                        isMe ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Sender Avatar */}
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm mt-1">
                        {senderDisplayName.charAt(0).toUpperCase()}
                      </div>

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {/* Sender Name */}
                        {!isMe && (
                          <span className="text-[11px] font-semibold text-slate-500 px-1 mb-0.5">
                            {senderDisplayName}
                          </span>
                        )}

                        {/* Main Message Bubble */}
                        <div className="relative group/bubble">
                          <div
                            className={`p-3 rounded-2xl shadow-sm space-y-2 ${
                              isMe
                                ? 'bg-[#e5efff] text-slate-900 rounded-tr-none border border-blue-200/60'
                                : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/80'
                            }`}
                          >
                            {/* Reply Quote Block */}
                            {msg.reply_to && (
                              <div className="p-2 bg-slate-100/90 rounded-lg border-l-4 border-blue-600 text-xs space-y-0.5 mb-1">
                                <p className="font-bold text-blue-600 text-[11px]">
                                  {msg.reply_to.user_name}
                                </p>
                                <p className="text-slate-600 line-clamp-2 text-[11px]">
                                  {msg.reply_to.content}
                                </p>
                              </div>
                            )}

                            {/* Attached Image */}
                            {msg.file_url && msg.file_type === 'image' && (
                              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
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
                                className="flex items-center gap-3 p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition border border-slate-300"
                              >
                                <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                                <div className="flex-1 min-w-0 text-xs">
                                  <p className="font-medium truncate text-slate-800">
                                    Tải về file đính kèm
                                  </p>
                                  <p className="text-[10px] text-slate-500">Bấm để mở / download</p>
                                </div>
                                <Download className="w-4 h-4 shrink-0 text-slate-600" />
                              </a>
                            )}

                            {/* Text Content */}
                            {msg.content && (
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {renderMessageContent(msg.content)}
                              </p>
                            )}

                            {/* Timestamp */}
                            <p className="text-[10px] text-slate-400 text-right">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {/* Hover Floating Actions (Reply & Reactions Bar) */}
                          <div
                            className={`absolute top-0 -translate-y-1/2 hidden group-hover/bubble:flex items-center bg-white border border-slate-200 rounded-full shadow-lg px-2 py-1 gap-1.5 z-10 ${
                              isMe ? 'right-0' : 'left-0'
                            }`}
                          >
                            {REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleAddReaction(msg.id, emoji)}
                                className="hover:scale-125 transition text-sm"
                                title="Thả cảm xúc"
                              >
                                {emoji}
                              </button>
                            ))}
                            <span className="w-px h-4 bg-slate-200 mx-0.5"></span>
                            <button
                              onClick={() => setReplyTarget(msg)}
                              className="text-slate-500 hover:text-blue-600 transition p-0.5"
                              title="Trả lời tin nhắn này"
                            >
                              <CornerUpLeft className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Render Reactions Badges Below Bubble */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div
                              className={`flex items-center gap-1 mt-1 ${
                                isMe ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {Object.entries(msg.reactions).map(([emoji, usersList]) => {
                                if (!usersList || usersList.length === 0) return null;
                                return (
                                  <span
                                    key={emoji}
                                    className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-full text-[11px] shadow-xs flex items-center gap-1 text-slate-600"
                                  >
                                    <span>{emoji}</span>
                                    <span className="font-bold">{usersList.length}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quoted Message Target Preview Bar */}
            {replyTarget && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <CornerUpLeft className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-blue-900">
                      Trả lời {replyTarget.user_name || replyTarget.user_email}:
                    </span>{' '}
                    <span className="text-slate-600 italic truncate">{replyTarget.content}</span>
                  </div>
                </div>
                <button
                  onClick={() => setReplyTarget(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mention Suggestion Popup */}
            {showMentionPopup && activeRoom?.allowed_emails && (
              <div className="mx-4 my-1 p-2 bg-white border border-slate-200 rounded-xl shadow-xl space-y-1 max-h-40 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-400 px-2 uppercase">Gợi ý nhắc tên (@):</p>
                {activeRoom.allowed_emails.map((emailStr) => (
                  <button
                    key={emailStr}
                    onClick={() => handleSelectMention(emailStr.split('@')[0])}
                    className="w-full text-left px-2 py-1.5 hover:bg-blue-50 rounded-lg text-xs text-slate-700 flex items-center gap-2"
                  >
                    <AtSign className="w-3.5 h-3.5 text-blue-600" />
                    <span>{emailStr}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Area Toolbar & Form */}
            <footer className="bg-white border-t border-slate-200 p-3 space-y-2">
              {/* Action Bar Tools Icons */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.zip,.txt"
                  />

                  <button
                    type="button"
                    onClick={() => setShowEmoji((prev) => !prev)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                    title="Chọn Sticker / Emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                    title="Gửi hình ảnh"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                    title="Đính kèm file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputText((prev) => prev + '@')}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition font-bold"
                    title="Nhắc tên (@)"
                  >
                    <AtSign className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendLike}
                    className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition"
                    title="Gửi Like 👍"
                  >
                    <ThumbsUp className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Text Input Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Nhập @, tin nhắn tới ${activeRoom.name}...`}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />

                <button
                  type="submit"
                  disabled={sending || (!inputText.trim() && !selectedFile)}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition disabled:opacity-40 flex items-center justify-center shrink-0"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f4f5f7]">
            <MessageSquare className="w-16 h-16 text-slate-300 stroke-[1.5] mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">Chào mừng tới Fica Chat</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Hãy chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo nhóm mới để bắt đầu.
            </p>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* COLUMN 4: RIGHT GROUP INFO PANEL (300px Width) */}
      {/* ========================================================================= */}
      {showRightPanel && activeRoom && (
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto font-sans z-10 hidden xl:flex">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 text-center space-y-3">
            <h3 className="font-bold text-sm text-slate-800">Thông tin nhóm</h3>

            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {activeRoom.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex items-center gap-1">
                <h4 className="font-bold text-sm text-slate-900">{activeRoom.name}</h4>
                <button className="p-1 text-slate-400 hover:text-blue-600">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4 Quick Circle Action Buttons */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <button className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-[10px]">Tắt thông báo</span>
              </button>

              <button
                onClick={() => handleTogglePinRoom(activeRoom.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <Pin className="w-4 h-4" />
                </div>
                <span className="text-[10px]">{activeRoom.pinned ? 'Bỏ ghim' : 'Ghim'}</span>
              </button>

              <button
                onClick={handleOpenMembersModal}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-[10px]">Thêm TV</span>
              </button>

              <button
                onClick={handleOpenMembersModal}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-[10px]">Quản lý</span>
              </button>
            </div>
          </div>

          {/* Members List Collapsible Section */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Thành viên nhóm ({(activeRoom.allowed_emails || []).length})</span>
              </h5>
              <button
                onClick={handleOpenMembersModal}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Xem tất cả
              </button>
            </div>

            {/* Preview First Few Members */}
            <div className="space-y-2">
              {(activeRoom.allowed_emails || []).slice(0, 4).map((emailStr, idx) => {
                const isOwner = emailStr.toLowerCase() === activeRoom.created_by.toLowerCase();
                const isVice = (activeRoom.vice_admins || []).some(
                  (v) => v.toLowerCase() === emailStr.toLowerCase()
                );

                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {emailStr.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-700 truncate">{emailStr}</span>
                    </div>

                    {isOwner && (
                      <span title="Trưởng nhóm">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      </span>
                    )}
                    {isVice && !isOwner && (
                      <span title="Phó nhóm">
                        <Award className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group News & Attachments Collapsible Section */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Ảnh/Video & File đã gửi</span>
            </h5>
            <p className="text-[11px] text-slate-400 italic">Chưa có file phương tiện nào.</p>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Delete Room Confirmation Modal */}
      {showDeleteRoomModal && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowDeleteRoomModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 text-lg">Xác nhận giải tán nhóm</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Bạn có chắc chắn muốn giải tán <strong className="text-slate-900">{activeRoom.name}</strong>? Tất cả tin nhắn và dữ liệu nhóm sẽ bị xóa hoàn toàn.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteRoomModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={deleteRoomLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleteRoomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Giải tán nhóm</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Management & Vice Admin Modal */}
      {showMembersModal && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200">
            <button
              onClick={() => setShowMembersModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Quản lý thành viên</h3>
                <p className="text-xs text-slate-500">{activeRoom.name}</p>
              </div>
            </div>

            {/* Add Member Input Form */}
            <form onSubmit={handleAddMember} className="flex gap-2 mb-5">
              <input
                type="email"
                required
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Nhập email nhân viên muốn thêm..."
                className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={memberActionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </form>

            {/* Members List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Danh sách thành viên ({roomMembers.length})
              </p>

              {roomMembers.map((member, index) => {
                const targetEmailLower = member.user_email.toLowerCase();
                const currentUserLower = (user?.email || '').toLowerCase();
                const isTargetMe = targetEmailLower === currentUserLower;

                const isVice =
                  (activeRoom.vice_admins || []).some(
                    (v) => v.toLowerCase() === targetEmailLower
                  ) || member.role === 'vice_admin';

                const isOwner =
                  targetEmailLower === (activeRoom.created_by || '').toLowerCase();

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs gap-3"
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {member.user_email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-800 font-semibold truncate">{member.user_email}</span>

                      {/* Badges */}
                      {isOwner && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                          <Crown className="w-3 h-3 text-amber-600" />
                          Trưởng nhóm
                        </span>
                      )}

                      {isVice && !isOwner && (
                        <span className="flex items-center gap-1 text-[10px] bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full font-bold shrink-0">
                          <Award className="w-3 h-3 text-sky-600" />
                          Phó nhóm
                        </span>
                      )}
                    </div>

                    {/* Action Controls for Other Members */}
                    {!isTargetMe && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleViceAdmin(
                              member.user_email,
                              isVice ? 'vice_admin' : 'member'
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                            isVice
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{isVice ? 'Hủy Phó nhóm' : 'Bổ nhiệm Phó nhóm'}</span>
                        </button>

                        <button
                          onClick={() => handleRemoveMember(member.user_email)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-200 rounded-lg transition"
                          title="Mời ra khỏi nhóm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowCreateRoomModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Tạo nhóm chat mới</h3>
                <p className="text-xs text-slate-500">Bạn sẽ là Trưởng nhóm của nhóm này</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Tên nhóm chat
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Ví dụ: HOLDING SHK - KẾ TOÁN, Team Thiết Kế..."
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo nhóm ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Thay đổi mật khẩu</h3>
                <p className="text-xs text-slate-500">Cập nhật mật khẩu mới cho tài khoản</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Nhập lại mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Cập nhật mật khẩu</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
