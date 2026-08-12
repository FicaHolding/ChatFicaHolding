'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Message, ChatRoom, RoomMember, Friend } from '@/lib/types';
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
  Video,
  Folder,
  Cloud,
  Contact2,
  Settings,
  AtSign,
  ThumbsUp,
  CornerUpLeft,
  ChevronDown,
  ChevronLeft,
  Edit2,
  Bell,
  Camera,
  Upload,
  UserCheck,
} from 'lucide-react';

const COMMON_EMOJIS = [
  '😊', '😂', '😍', '👍', '🔥', '🎉', '❤️', '🙌', 
  '😎', '🚀', '✨', '💯', '🤣', '😭', '😮', '😡', 
  '🙏', '👏', '🥳', '🥰', '🤔', '💪', '🤝', '⭐', 
  '❤️‍🔥', '👌', '🎯', '💡', '💬', '☕', '🎁', '🏆'
];
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const GLOBAL_SUPER_ADMIN = 'fica.holding@gmail.com';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Left Nav Tab: 'chats' | 'contacts'
  const [activeNavTab, setActiveNavTab] = useState<'chats' | 'contacts'>('chats');

  // Mobile View Navigation Mode: 'list' (Chat/Contacts list) | 'chat' (Active Chat feed)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Friends & Contacts State
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [addFriendEmailInput, setAddFriendEmailInput] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState<string | null>(null);

  // User Profiles Map (email -> { name, avatar_url }) for real-time name & photo lookup
  const [userProfiles, setUserProfiles] = useState<{ [email: string]: { name?: string; avatar_url?: string } }>({
    'huytq.ktv@gmail.com': { name: 'Trịnh Huy' },
    'fica.holding@gmail.com': { name: 'Fica Holding' },
  });

  // Real-time last message preview map per room ID: { [roomId]: { senderEmail, content, time } }
  const [roomLastMessages, setRoomLastMessages] = useState<{
    [roomId: string]: { senderEmail?: string; content: string; time: string };
  }>({});

  // Search & Filter Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');

  // Right Panel & Sidebar Toggles
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Reply & Mention States
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Rooms state (persisted in localStorage)
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);

  // Create new room modal
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Rename room modal
  const [showRenameRoomModal, setShowRenameRoomModal] = useState(false);
  const [editRoomNameInput, setEditRoomNameInput] = useState('');

  // Delete room confirm modal
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [deleteRoomLoading, setDeleteRoomLoading] = useState(false);

  // Group Settings Modal (Zalo Quản lý nhóm)
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);

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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Deterministic 1-on-1 Direct Room ID Generator (identical for both users across all devices)
  const getDeterministicDirectRoomId = (email1: string, email2: string): string => {
    const sorted = [email1.toLowerCase().trim(), email2.toLowerCase().trim()].sort();
    return `direct_${sorted[0]}_${sorted[1]}`;
  };

  // Load Friends list from localStorage & sync to userProfiles
  useEffect(() => {
    try {
      const savedFriends = localStorage.getItem('fica_friends_list_v2');
      if (savedFriends) {
        const parsedFriends = JSON.parse(savedFriends) as Friend[];
        setFriendsList(parsedFriends);

        // Update profile lookup map
        setUserProfiles((prev) => {
          const updated = { ...prev };
          parsedFriends.forEach((f) => {
            if (f.email) {
              const lower = f.email.toLowerCase().trim();
              updated[lower] = {
                name: f.name || updated[lower]?.name || f.email.split('@')[0],
                avatar_url: f.avatar_url || updated[lower]?.avatar_url,
              };
            }
          });
          return updated;
        });
      } else {
        const defaultFriends: Friend[] = [
          { email: 'fica.holding@gmail.com', name: 'Fica Holding' },
          { email: 'huytq.ktv@gmail.com', name: 'Trịnh Huy' },
        ];
        setFriendsList(defaultFriends);
        localStorage.setItem('fica_friends_list_v2', JSON.stringify(defaultFriends));
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // Universal Helper: Resolve Partner Email in 1-on-1 Direct Chat Room (ALWAYS THE OTHER PERSON)
  const getDirectChatPartnerEmail = (room: ChatRoom, myEmail?: string | null): string => {
    if (!myEmail) return room.direct_user_email || room.created_by;
    const meLower = myEmail.toLowerCase().trim();

    // Look for the email in allowed_emails that is NOT me
    const partner = (room.allowed_emails || []).find(
      (e) => e.toLowerCase().trim() !== meLower
    );

    if (partner) return partner;

    // Fallback: If room creator is not me, partner is creator; otherwise direct_user_email
    if (room.created_by && room.created_by.toLowerCase().trim() !== meLower) {
      return room.created_by;
    }

    return room.direct_user_email || room.created_by;
  };

  // Universal Helper: Resolve Friend/User Display Name
  const getDisplayNameForEmail = (email?: string | null, fallbackName?: string | null): string => {
    if (!email) return fallbackName || 'Thành viên Fica';
    const lowerEmail = email.toLowerCase().trim();

    // Check my own profile
    if (user?.email?.toLowerCase().trim() === lowerEmail && displayName) {
      return displayName;
    }

    // Check friends list first
    const friend = friendsList.find((f) => f.email.toLowerCase().trim() === lowerEmail);
    if (friend && friend.name) return friend.name;

    // Check user profiles cache
    if (userProfiles[lowerEmail]?.name) return userProfiles[lowerEmail].name;

    // Check fallbackName if it's not a raw email prefix
    if (fallbackName && !fallbackName.includes('@') && !fallbackName.startsWith('Chat với')) {
      return fallbackName;
    }

    return lowerEmail.split('@')[0];
  };

  // Universal Helper: Resolve Friend/User Avatar URL
  const getAvatarForEmail = (email?: string | null): string | null => {
    if (!email) return null;
    const lowerEmail = email.toLowerCase().trim();

    // Check my own avatar
    if (user?.email?.toLowerCase().trim() === lowerEmail && avatarUrl) {
      return avatarUrl;
    }

    // Check friends list
    const friend = friendsList.find((f) => f.email.toLowerCase().trim() === lowerEmail);
    if (friend?.avatar_url) return friend.avatar_url;

    // Check user profiles cache
    if (userProfiles[lowerEmail]?.avatar_url) return userProfiles[lowerEmail].avatar_url;

    return null;
  };

  // Render User Avatar Photo with Initial Fallback
  const renderUserAvatar = (
    email?: string | null,
    fallbackName?: string | null,
    sizeClass = 'w-10 h-10 text-sm'
  ) => {
    const photoUrl = getAvatarForEmail(email);
    const resolvedName = getDisplayNameForEmail(email, fallbackName || undefined);
    const initial = resolvedName.charAt(0).toUpperCase();

    if (photoUrl) {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={photoUrl}
          alt={resolvedName}
          className={`${sizeClass} rounded-full object-cover shadow-xs border border-slate-200 shrink-0`}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs shrink-0`}
      >
        {initial}
      </div>
    );
  };

  // Purge ALL stale room cache keys & initialize fresh clean rooms v90 (Deterministic IDs)
  useEffect(() => {
    try {
      const userEmail = user?.email || GLOBAL_SUPER_ADMIN;
      const targetFriendEmail =
        userEmail.toLowerCase() === 'huytq.ktv@gmail.com'
          ? 'fica.holding@gmail.com'
          : 'huytq.ktv@gmail.com';
      const targetFriendName =
        userEmail.toLowerCase() === 'huytq.ktv@gmail.com' ? 'Fica Holding' : 'Trịnh Huy';

      const directHoldingHuyId = getDeterministicDirectRoomId(userEmail, targetFriendEmail);

      // Purge all legacy cache keys up to v89
      const keysToPurge = Array.from({ length: 90 }, (_, i) =>
        i === 0 ? 'fica_chat_rooms' : `fica_chat_rooms_v${i}`
      );
      keysToPurge.forEach((k) => localStorage.removeItem(k));

      const savedRooms = localStorage.getItem('fica_chat_rooms_v90');
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

      // Default initial rooms displaying BOTH Group chats & Direct 1-1 Friend chats with deterministic IDs
      const initialDefaultRooms: ChatRoom[] = [
        {
          id: 'room_ke_toan',
          name: 'HOLDING SHK - KẾ TOÁN',
          created_by: userEmail,
          isPrivate: true,
          vice_admins: [],
          allowed_emails: [userEmail, targetFriendEmail],
          pinned: true,
        },
        {
          id: directHoldingHuyId,
          name: targetFriendName,
          created_by: userEmail,
          isPrivate: true,
          isDirect: true,
          direct_user_email: targetFriendEmail,
          allowed_emails: [userEmail, targetFriendEmail],
        },
        {
          id: 'room_ky_thuat',
          name: 'Thanh niên quậy - quẩy eco',
          created_by: userEmail,
          isPrivate: true,
          vice_admins: [],
          allowed_emails: [userEmail, targetFriendEmail],
        },
      ];

      setRooms(initialDefaultRooms);
      localStorage.setItem('fica_chat_rooms_v90', JSON.stringify(initialDefaultRooms));
    } catch (e) {
      console.log('Error initializing clean rooms:', e);
    }
  }, [user]);

  // Save custom rooms state to localStorage
  const updateRoomsState = (newRooms: ChatRoom[]) => {
    const cleanRooms = newRooms.filter((r) => r.id !== 'general');
    setRooms(cleanRooms);
    try {
      localStorage.setItem('fica_chat_rooms_v90', JSON.stringify(cleanRooms));
    } catch (e) {
      console.log('Error saving rooms:', e);
    }
  };

  // Rename Active Room Handler
  const handleRenameRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoomNameInput.trim() || !activeRoom) return;

    const newName = editRoomNameInput.trim();
    const updatedRooms = rooms.map((r) => (r.id === activeRoom.id ? { ...r, name: newName } : r));

    updateRoomsState(updatedRooms);
    setActiveRoom({ ...activeRoom, name: newName });
    setShowRenameRoomModal(false);
    setShowGroupSettingsModal(false);
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
    .filter((r) => {
      const partnerEmail = r.isDirect ? getDirectChatPartnerEmail(r, user?.email) : null;
      const title = r.isDirect ? getDisplayNameForEmail(partnerEmail, r.name) : r.name;
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });

  // Filter friends list
  const filteredFriends = friendsList.filter(
    (f) =>
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Robust helper to check if a message belongs to a specific room
  const isMessageInRoom = (msg: Message, room: ChatRoom | null): boolean => {
    if (!room) return false;

    let deterministicId: string | null = null;
    if (room.isDirect && room.allowed_emails && room.allowed_emails.length >= 2) {
      deterministicId = getDeterministicDirectRoomId(room.allowed_emails[0], room.allowed_emails[1]);
    }

    const checkMatch = (rId?: string | null): boolean => {
      if (!rId) return false;
      if (rId === room.id) return true;
      if (deterministicId && rId === deterministicId) return true;
      if (room.isDirect && room.allowed_emails && room.allowed_emails.length >= 2) {
        const e1 = room.allowed_emails[0].toLowerCase().trim();
        const e2 = room.allowed_emails[1].toLowerCase().trim();
        if (rId.includes(e1) && rId.includes(e2)) return true;
      }
      return false;
    };

    // 1. Direct match on msg.room_id
    if (msg.room_id && checkMatch(msg.room_id)) return true;

    // 2. Check localStorage mapping by msg.id
    try {
      const localRoom = localStorage.getItem(`fica_msg_room_${msg.id}`);
      if (localRoom && checkMatch(localRoom)) return true;
    } catch {
      // Safe
    }

    // 3. Check localStorage content mapping
    if (msg.content) {
      try {
        const contentKey = `fica_msg_content_${encodeURIComponent(msg.content.substring(0, 30))}`;
        const localContentRoom = localStorage.getItem(contentKey);
        if (localContentRoom && checkMatch(localContentRoom)) return true;
      } catch {
        // Safe
      }
    }

    // 4. For 1-on-1 direct rooms fallback
    if (room.isDirect && room.allowed_emails && room.allowed_emails.length >= 2) {
      const allowedLowers = room.allowed_emails.map((e) => e.toLowerCase().trim());
      const msgSender = (msg.user_email || '').toLowerCase().trim();
      if (allowedLowers.includes(msgSender)) {
        if (!msg.room_id || checkMatch(msg.room_id)) {
          return true;
        }
      }
    }

    return false;
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

  // Start 1-on-1 Direct Chat with a friend (Deterministic Room ID)
  const handleStartDirectChat = (friendEmail: string, friendName?: string) => {
    if (!user) return;
    const myEmail = user.email || '';
    const targetEmail = friendEmail.toLowerCase().trim();

    if (targetEmail === myEmail.toLowerCase()) {
      alert('Bạn không thể tự chat riêng với chính mình!');
      return;
    }

    const resolvedName = getDisplayNameForEmail(targetEmail, friendName);
    const deterministicRoomId = getDeterministicDirectRoomId(myEmail, targetEmail);

    const cleanDirectRoom: ChatRoom = {
      id: deterministicRoomId,
      name: resolvedName,
      created_by: myEmail,
      isPrivate: true,
      isDirect: true,
      direct_user_email: targetEmail,
      allowed_emails: [myEmail, targetEmail],
    };

    // Strip out any stale direct room with room ID or partner email mismatch
    const otherRooms = rooms.filter((r) => {
      if (r.id === deterministicRoomId) return false;
      if (r.isDirect) {
        const partner = getDirectChatPartnerEmail(r, myEmail);
        if (partner.toLowerCase().trim() === targetEmail) return false;
      }
      return true;
    });

    const updatedRooms = [...otherRooms, cleanDirectRoom];
    updateRoomsState(updatedRooms);
    setActiveRoom(cleanDirectRoom);
    setActiveNavTab('chats');
    setMobileView('chat');
    setShowMembersModal(false);
    setShowMobileSidebar(false);
  };

  // Add Friend Handler
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendEmailInput.trim() || !user) return;

    const emailToAdd = addFriendEmailInput.trim().toLowerCase();

    if (emailToAdd === user.email?.toLowerCase()) {
      alert('Bạn không thể kết bạn với chính mình!');
      return;
    }

    if (friendsList.some((f) => f.email.toLowerCase() === emailToAdd)) {
      alert('Email này đã có trong danh sách bạn bè!');
      return;
    }

    const friendDisplayName = emailToAdd.split('@')[0];
    const newFriendObj: Friend = {
      email: emailToAdd,
      name: friendDisplayName,
    };

    const updatedFriends = [...friendsList, newFriendObj];
    setFriendsList(updatedFriends);

    setUserProfiles((prev) => ({
      ...prev,
      [emailToAdd]: { name: friendDisplayName },
    }));

    try {
      localStorage.setItem('fica_friends_list_v2', JSON.stringify(updatedFriends));
    } catch {
      // Safe
    }

    // Automatically create 1-on-1 Direct Room for new friend
    handleStartDirectChat(emailToAdd, friendDisplayName);

    setAddFriendSuccess(`Đã thêm ${emailToAdd} vào danh sách bạn bè thành công!`);
    setAddFriendEmailInput('');
    setTimeout(() => {
      setShowAddFriendModal(false);
      setAddFriendSuccess(null);
    }, 1200);
  };

  const roomsRef = useRef(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  const [allMessages, setAllMessages] = useState<Message[]>([]);

  // Initial load: User session & Fetch existing messages for all rooms & Setup Global Realtime
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
      const myAvatar = currentUser.user_metadata?.avatar_url || null;
      setAvatarUrl(myAvatar);

      // Cache my profile
      if (currentUser.email) {
        setUserProfiles((prev) => ({
          ...prev,
          [currentUser.email!.toLowerCase().trim()]: {
            name,
            avatar_url: myAvatar || undefined,
          },
        }));
      }

      // Fetch messages for ALL rooms
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const fetchedMsgs = data as Message[];
        setAllMessages(fetchedMsgs);

        // Extract real-time last message per room across all fetched messages
        const lastMap: { [rId: string]: { senderEmail?: string; content: string; time: string } } = {};
        fetchedMsgs.forEach((m) => {
          roomsRef.current.forEach((r) => {
            if (isMessageInRoom(m, r)) {
              lastMap[r.id] = {
                senderEmail: m.user_email,
                content: m.content || (m.file_type === 'image' ? '[Hình ảnh]' : '[Tập tin]'),
                time: m.created_at,
              };
            }
          });

          // Also extract sender avatars from message history
          if (m.user_email && (m.user_name || m.user_avatar)) {
            const lower = m.user_email.toLowerCase().trim();
            setUserProfiles((prev) => {
              if (prev[lower]?.avatar_url === m.user_avatar && prev[lower]?.name === m.user_name)
                return prev;
              return {
                ...prev,
                [lower]: {
                  name: m.user_name || prev[lower]?.name || lower.split('@')[0],
                  avatar_url: m.user_avatar || prev[lower]?.avatar_url,
                },
              };
            });
          }
        });
        setRoomLastMessages((prev) => ({ ...prev, ...lastMap }));
      }

      setLoading(false);

      // Setup Global Realtime channel for all incoming messages
      channel = supabase
        .channel('global-messages-feed')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMessage = payload.new as Message;

            // Dynamically update sender avatar profile cache
            if (newMessage.user_email && (newMessage.user_name || newMessage.user_avatar)) {
              const lower = newMessage.user_email.toLowerCase().trim();
              setUserProfiles((prev) => ({
                ...prev,
                [lower]: {
                  name: newMessage.user_name || prev[lower]?.name || lower.split('@')[0],
                  avatar_url: newMessage.user_avatar || prev[lower]?.avatar_url,
                },
              }));
            }

            // Append to allMessages state
            setAllMessages((prev) => {
              const existingIndex = prev.findIndex((m) => isSameMessage(m, newMessage));
              if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = newMessage;
                return updated;
              }
              return [...prev, newMessage];
            });

            // Update real-time room last message preview
            roomsRef.current.forEach((r) => {
              if (isMessageInRoom(newMessage, r)) {
                setRoomLastMessages((prev) => ({
                  ...prev,
                  [r.id]: {
                    senderEmail: newMessage.user_email,
                    content: newMessage.content || (newMessage.file_type === 'image' ? '[Hình ảnh]' : '[Tập tin]'),
                    time: newMessage.created_at,
                  },
                }));
              }
            });
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
  }, [router, supabase]);

  // Dynamically filter activeRoom messages whenever activeRoom or allMessages update
  useEffect(() => {
    if (activeRoom) {
      const filtered = allMessages.filter((m) => isMessageInRoom(m, activeRoom));
      setMessages(filtered);
    } else {
      setMessages([]);
    }
  }, [activeRoom, allMessages]);

  // Handle Avatar Image File Selection in Edit Profile Modal
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Handle Display Name & Avatar Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameInput.trim() || !user) return;

    setProfileLoading(true);
    setProfileSuccess(null);

    let updatedAvatarPublicUrl = avatarUrl;

    try {
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatars/${user.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(fileName);

          updatedAvatarPublicUrl = publicUrlData.publicUrl;
        }
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: editNameInput.trim(),
          avatar_url: updatedAvatarPublicUrl,
        },
      });

      if (error) {
        alert('Lỗi cập nhật profile: ' + error.message);
      } else if (data.user) {
        setUser(data.user);
        setDisplayName(editNameInput.trim());
        setAvatarUrl(updatedAvatarPublicUrl);

        if (user.email) {
          setUserProfiles((prev) => ({
            ...prev,
            [user.email!.toLowerCase().trim()]: {
              name: editNameInput.trim(),
              avatar_url: updatedAvatarPublicUrl || undefined,
            },
          }));
        }

        setProfileSuccess('Đã cập nhật tên và ảnh đại diện thành công!');
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

  // Handle Delete Chat Room / Disband Group / Clear Conversation
  const handleDeleteRoom = async () => {
    if (!activeRoom) return;

    setDeleteRoomLoading(true);

    const roomToDelete = activeRoom;
    let deterministicId: string | null = null;
    let partnerEmail: string | null = null;

    if (roomToDelete.isDirect && roomToDelete.allowed_emails && roomToDelete.allowed_emails.length >= 2) {
      deterministicId = getDeterministicDirectRoomId(roomToDelete.allowed_emails[0], roomToDelete.allowed_emails[1]);
      partnerEmail = getDirectChatPartnerEmail(roomToDelete, user?.email);
    }

    try {
      // 1. Delete DB messages matching room.id
      await supabase.from('messages').delete().eq('room_id', roomToDelete.id);

      // 2. Delete DB messages matching deterministicId if different
      if (deterministicId && deterministicId !== roomToDelete.id) {
        await supabase.from('messages').delete().eq('room_id', deterministicId);
      }

      // 3. Delete DB messages sent by partner email
      if (partnerEmail) {
        await supabase.from('messages').delete().eq('user_email', partnerEmail);
      }

      await supabase.from('room_members').delete().eq('room_id', roomToDelete.id);
      if (deterministicId) {
        await supabase.from('room_members').delete().eq('room_id', deterministicId);
      }
    } catch (e) {
      console.log('Error deleting room records on DB:', e);
    } finally {
      // Purge local allMessages and messages state for this room
      setAllMessages((prev) => prev.filter((m) => !isMessageInRoom(m, roomToDelete)));
      setMessages([]);

      // Clear last message preview map entry
      setRoomLastMessages((prev) => {
        const updated = { ...prev };
        delete updated[roomToDelete.id];
        if (deterministicId) delete updated[deterministicId];
        return updated;
      });

      const filteredRooms = rooms.filter((r) => r.id !== roomToDelete.id && r.id !== deterministicId);
      updateRoomsState(filteredRooms);

      const nextRoom = filteredRooms.find((r) => canUserAccessRoom(r, user?.email)) || null;
      setActiveRoom(nextRoom);

      setDeleteRoomLoading(false);
      setShowDeleteRoomModal(false);
      setShowGroupSettingsModal(false);
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

  // Direct Message Sender
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
        user_avatar: avatarUrl,
        content: messageContent,
        file_url: uploadedFileUrl,
        file_type: uploadedFileType,
        room_id: currentRoomId,
        reply_to: replyTarget
          ? {
              id: replyTarget.id,
              user_name: getDisplayNameForEmail(replyTarget.user_email, replyTarget.user_name),
              content: replyTarget.content,
            }
          : null,
        created_at: new Date().toISOString(),
      };

      try {
        localStorage.setItem(`fica_msg_room_${tempId}`, currentRoomId);
        if (messageContent) {
          localStorage.setItem(
            `fica_msg_content_${encodeURIComponent(messageContent.substring(0, 30))}`,
            currentRoomId
          );
        }
      } catch {
        // Ignore
      }

      setAllMessages((prev) => {
        const existingIndex = prev.findIndex((m) => isSameMessage(m, newMsgObj));
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newMsgObj;
          return updated;
        }
        return [...prev, newMsgObj];
      });

      setMessages((prev) => {
        const existingIndex = prev.findIndex((m) => isSameMessage(m, newMsgObj));
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newMsgObj;
          return updated;
        }
        return [...prev, newMsgObj];
      });

      // Update real-time room last message preview
      setRoomLastMessages((prev) => ({
        ...prev,
        [currentRoomId]: {
          senderEmail: user.email || '',
          content: messageContent || (uploadedFileType === 'image' ? '[Hình ảnh]' : '[Tập tin]'),
          time: new Date().toISOString(),
        },
      }));

      setInputText('');
      setReplyTarget(null);
      handleClearFile();

      let { data: insertedData, error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: displayName,
          user_avatar: avatarUrl,
          content: messageContent,
          file_url: uploadedFileUrl,
          file_type: uploadedFileType,
          room_id: currentRoomId,
        })
        .select();

      if (insertError) {
        console.log('Supabase Tier 1 Insert failed, trying Tier 2:', insertError);
        // Tier 2 Insert: minimal fields WITH room_id
        const { data: retry1Data, error: retry1Error } = await supabase
          .from('messages')
          .insert({
            user_id: user.id,
            user_email: user.email,
            content: messageContent,
            file_url: uploadedFileUrl,
            file_type: uploadedFileType,
            room_id: currentRoomId,
          })
          .select();

        if (!retry1Error && retry1Data) {
          insertedData = retry1Data;
        } else {
          console.log('Supabase Tier 2 Insert failed, trying Tier 3:', retry1Error);
          // Tier 3 Insert: standard fields WITHOUT room_id (guaranteed on all Supabase setups)
          const { data: retry2Data, error: retry2Error } = await supabase
            .from('messages')
            .insert({
              user_id: user.id,
              user_email: user.email,
              content: messageContent,
              file_url: uploadedFileUrl,
              file_type: uploadedFileType,
            })
            .select();

          if (!retry2Error && retry2Data) {
            insertedData = retry2Data;
          }
        }
      }

      if (insertedData && insertedData[0]?.id) {
        const realId = insertedData[0].id;
        const fullInsertedObj: Message = {
          ...insertedData[0],
          room_id: insertedData[0].room_id || currentRoomId,
          user_name: insertedData[0].user_name || displayName,
          user_avatar: insertedData[0].user_avatar || avatarUrl,
        };

        try {
          localStorage.setItem(`fica_msg_room_${realId}`, currentRoomId);
        } catch {
          // Ignore
        }

        // Guarantee state update with fullInsertedObj
        setAllMessages((prev) => prev.map((m) => (isSameMessage(m, newMsgObj) ? fullInsertedObj : m)));
        setMessages((prev) => prev.map((m) => (isSameMessage(m, newMsgObj) ? fullInsertedObj : m)));
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

  // Active Direct Partner Email
  const activeDirectPartnerEmail = activeRoom?.isDirect
    ? getDirectChatPartnerEmail(activeRoom, user?.email)
    : null;

  const activeRoomTitle = activeRoom
    ? activeRoom.isDirect
      ? getDisplayNameForEmail(activeDirectPartnerEmail, activeRoom.name)
      : activeRoom.name
    : '';

  return (
    <div className="flex flex-col h-screen bg-[#eef0f3] text-slate-800 max-w-[1600px] mx-auto w-full shadow-2xl overflow-hidden font-sans select-none">
      {/* ========================================================================= */}
      {/* TOP ZALO PC WINDOW TITLE BAR */}
      {/* ========================================================================= */}
      <div className="h-8 bg-[#e3e8f0] border-b border-slate-300 flex items-center justify-between px-3 text-[11px] font-medium text-slate-700 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-700">Fica Chat</span>
          <span className="text-slate-400">|</span>
          <span className="font-medium text-slate-700">{displayName || user?.email}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <button title="Khóa ứng dụng" className="hover:text-slate-800">
            🔒
          </button>
          <button title="Thu nhỏ" className="hover:text-slate-800">
            ─
          </button>
          <button title="Phóng to" className="hover:text-slate-800">
            ❐
          </button>
          <button title="Đóng" className="hover:text-red-600">
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ========================================================================= */}
        {/* COLUMN 1: LEFTMOST ICON NAV BAR (Zalo Dark Blue #001a33) */}
        {/* ========================================================================= */}
        <nav className="w-16 bg-[#001a33] flex flex-col items-center py-4 justify-between shrink-0 z-20">
          <div className="flex flex-col items-center gap-6">
            {/* User Profile Avatar Picture */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="relative group transition hover:scale-105"
              title="Đổi ảnh đại diện / Tài khoản"
            >
              {renderUserAvatar(user?.email, displayName, 'w-10 h-10 border-2 border-white/80')}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#001a33] rounded-full"></span>
            </button>

            {/* Navigation Items (Tabs Switcher: Chat 💬 vs Danh Bạ 📇) */}
            <div className="flex flex-col items-center gap-4 w-full">
              <button
                onClick={() => setActiveNavTab('chats')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
                  activeNavTab === 'chats'
                    ? 'text-white bg-blue-600 shadow-lg shadow-blue-600/30'
                    : 'text-blue-200/60 hover:text-white hover:bg-white/10'
                }`}
                title="Hội thoại tin nhắn"
              >
                <MessageSquare className="w-6 h-6" />
              </button>

              <button
                onClick={() => setActiveNavTab('contacts')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
                  activeNavTab === 'contacts'
                    ? 'text-white bg-blue-600 shadow-lg shadow-blue-600/30'
                    : 'text-blue-200/60 hover:text-white hover:bg-white/10'
                }`}
                title="Danh bạ bạn bè"
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
        {/* COLUMN 2: CHAT ROOMS & FRIENDS CONTACTS COLUMN (320px Width on Desktop, 100% Full Width on Mobile) */}
        {/* ========================================================================= */}
        <aside
          className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-300 ${
            mobileView === 'list' ? 'flex flex-1 h-full w-full' : 'hidden md:flex'
          }`}
        >
          {/* Top Search Bar & Actions (+👤 Thêm bạn & +👥 Tạo nhóm) */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm"
                className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-slate-100 rounded-lg text-sm sm:text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Add Friend Button (+👤) */}
            <button
              onClick={() => setShowAddFriendModal(true)}
              className="p-2 sm:p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
              title="Thêm bạn mới (+👤)"
            >
              <UserPlus className="w-5 h-5" />
            </button>

            {/* Create Group Button (+👥) */}
            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="p-2 sm:p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
              title="Tạo nhóm mới (+👥)"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>

          {/* VIEW MODE 1: CHATS LIST (When activeNavTab === 'chats') */}
          {activeNavTab === 'chats' ? (
            <>
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
                    const isDirectChat = room.isDirect;

                    // Compute partner email for 1-1 chat
                    const partnerEmail = isDirectChat
                      ? getDirectChatPartnerEmail(room, user?.email)
                      : null;

                    const displayNameToShow = isDirectChat
                      ? getDisplayNameForEmail(partnerEmail, room.name)
                      : room.name;

                    const lastMsg = roomLastMessages[room.id];
                    const isLastMsgMe = lastMsg?.senderEmail?.toLowerCase() === user?.email?.toLowerCase();

                    const previewText = lastMsg
                      ? `${isLastMsgMe ? 'Bạn: ' : ''}${lastMsg.content}`
                      : isDirectChat
                      ? null
                      : `${(room.allowed_emails || []).length} thành viên`;

                    const timeText = lastMsg
                      ? new Date(lastMsg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          setActiveRoom(room);
                          setMobileView('chat');
                        }}
                        className={`flex items-center gap-3 p-3 mx-2 my-1 rounded-xl cursor-pointer transition relative group ${
                          isActive
                            ? 'bg-[#e5efff] border-l-4 border-blue-600'
                            : 'hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {isDirectChat ? (
                            /* Direct 1-on-1 Personal Avatar with partner photo sync */
                            renderUserAvatar(partnerEmail, displayNameToShow, 'w-12 h-12 text-sm')
                          ) : (
                            /* Group Chat Avatar */
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                              {displayNameToShow.charAt(0).toUpperCase()}
                            </div>
                          )}
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
                              className={`text-xs truncate flex items-center gap-1.5 ${
                                isActive ? 'text-blue-900 font-bold' : 'text-slate-800 font-semibold'
                              }`}
                            >
                              {/* Show Group Icon 👥 ONLY for Group Chats, NOT for Direct 1-1 Chats! */}
                              {!isDirectChat && <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                              <span className="truncate">{displayNameToShow}</span>
                            </h4>
                            {timeText && <span className="text-[10px] text-slate-400 shrink-0">{timeText}</span>}
                          </div>

                          {previewText && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {previewText}
                            </p>
                          )}
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
            </>
          ) : (
            /* VIEW MODE 2: DANH BẠ BẠN BÈ (When activeNavTab === 'contacts') */
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Contact2 className="w-4 h-4 text-blue-600" />
                  <span>Danh sách bạn bè ({filteredFriends.length})</span>
                </span>
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bạn</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {filteredFriends.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <p>Chưa có bạn bè nào.</p>
                    <button
                      onClick={() => setShowAddFriendModal(true)}
                      className="text-blue-600 font-bold underline"
                    >
                      + Nhập email kết bạn ngay
                    </button>
                  </div>
                ) : (
                  filteredFriends.map((friend, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 hover:bg-blue-50/60 rounded-xl transition gap-2"
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        {renderUserAvatar(friend.email, friend.name, 'w-10 h-10 text-xs')}
                        <div className="truncate min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {getDisplayNameForEmail(friend.email, friend.name)}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{friend.email}</p>
                        </div>
                      </div>

                      {/* Quick 1-on-1 Chat Button */}
                      <button
                        onClick={() => handleStartDirectChat(friend.email, friend.name)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs"
                        title="Nhắn tin riêng 1-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Nhắn tin</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Mobile Zalo Bottom Navigation Bar (Visible ONLY on Mobile < 768px when in List View) */}
          <div className="md:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around shrink-0 z-30 px-2 shadow-lg">
            <button
              onClick={() => setActiveNavTab('chats')}
              className={`flex flex-col items-center gap-0.5 transition ${
                activeNavTab === 'chats' ? 'text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px]">Tin nhắn</span>
            </button>

            <button
              onClick={() => setActiveNavTab('contacts')}
              className={`flex flex-col items-center gap-0.5 transition ${
                activeNavTab === 'contacts' ? 'text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Contact2 className="w-5 h-5" />
              <span className="text-[10px]">Danh bạ</span>
            </button>

            <button
              onClick={() => {
                setShowProfileModal(true);
                setEditNameInput(displayName);
                setAvatarPreview(avatarUrl);
                setProfileSuccess(null);
              }}
              className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-blue-600 transition"
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-[10px]">Cá nhân</span>
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* COLUMN 3: MAIN CHAT FEED WINDOW (Central Flex-1 on Desktop, 100% Width on Mobile) */}
        {/* ========================================================================= */}
        <main
          className={`flex-1 flex flex-col h-full bg-[#f4f5f7] min-w-0 border-r border-slate-200 relative ${
            mobileView === 'chat' ? 'flex flex-1 h-full w-full' : 'hidden md:flex'
          }`}
        >
          {activeRoom ? (
            <>
              {/* Top Bar Header */}
              <header className="h-16 px-3 sm:px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Mobile Back Arrow Button ⬅️ */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 text-slate-700 hover:bg-slate-100 rounded-full transition shrink-0"
                    title="Quay lại danh sách"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                  </button>

                  {activeRoom.isDirect ? (
                    renderUserAvatar(activeDirectPartnerEmail, activeRoomTitle, 'w-10 h-10 text-sm')
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                      {activeRoomTitle.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <span>{activeRoomTitle}</span>
                      {activeRoom.isDirect ? (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                          Chat riêng 1-1
                        </span>
                      ) : isRoomOwner(activeRoom, user?.email) ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold border border-amber-300">
                          👑 Trưởng nhóm
                        </span>
                      ) : null}
                    </h2>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>
                        {activeRoom.isDirect
                          ? `Hội thoại riêng`
                          : `${(activeRoom.allowed_emails || []).length} thành viên`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Action Tools Header Icons */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {!activeRoom.isDirect && (
                    <button
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                      title="Thêm thành viên"
                      onClick={handleOpenMembersModal}
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  )}

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
                    title="Thông tin hội thoại"
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
                    const isMe =
                      (msg.user_id && msg.user_id === user?.id) ||
                      (msg.user_email &&
                        user?.email &&
                        msg.user_email.toLowerCase().trim() === user.email.toLowerCase().trim());
                    const senderDisplayName = getDisplayNameForEmail(
                      msg.user_email,
                      msg.user_name || undefined
                    );

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 group w-full ${
                          isMe ? 'justify-end flex-row-reverse' : 'justify-start flex-row'
                        }`}
                      >
                        {/* Sender Avatar Photo (Syncs for both Me and Friend) */}
                        {renderUserAvatar(
                          msg.user_email,
                          senderDisplayName,
                          'w-8 h-8 text-xs mt-1 border border-slate-300'
                        )}

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
                                    {getDisplayNameForEmail(undefined, msg.reply_to.user_name)}
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
                        Trả lời {getDisplayNameForEmail(replyTarget.user_email, replyTarget.user_name)}:
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
                      onClick={() => handleSelectMention(getDisplayNameForEmail(emailStr))}
                      className="w-full text-left px-2 py-1.5 hover:bg-blue-50 rounded-lg text-xs text-slate-700 flex items-center gap-2"
                    >
                      <AtSign className="w-3.5 h-3.5 text-blue-600" />
                      <span>{getDisplayNameForEmail(emailStr)} ({emailStr})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Emoji Picker Popup Panel */}
              {showEmoji && (
                <div className="absolute bottom-20 left-4 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-30 w-80 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Biểu tượng cảm xúc (Emoji)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmoji(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
                    {COMMON_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="w-9 h-9 text-2xl flex items-center justify-center hover:bg-blue-50 hover:scale-125 rounded-xl transition cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
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

                    {/* Smile Emoji Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmoji((prev) => !prev)}
                      className={`p-1.5 rounded-lg transition ${
                        showEmoji
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                      }`}
                      title="Chọn Sticker / Emoji mặt cười"
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
                    placeholder={`Nhập @, tin nhắn tới ${activeRoomTitle}...`}
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
                Hãy chọn một cuộc trò chuyện từ danh sách bên trái hoặc bấm +👤 để kết bạn nhắn tin riêng!
              </p>
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* COLUMN 4: RIGHT GROUP / DIRECT INFO PANEL (300px Width) */}
        {/* ========================================================================= */}
        {showRightPanel && activeRoom && (
          <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto font-sans z-10 hidden xl:flex justify-between">
            <div>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 text-center space-y-3">
                <h3 className="font-bold text-sm text-slate-800">
                  {activeRoom.isDirect ? 'Thông tin hội thoại' : 'Thông tin nhóm'}
                </h3>

                <div className="flex flex-col items-center gap-2">
                  {activeRoom.isDirect ? (
                    renderUserAvatar(activeDirectPartnerEmail, activeRoomTitle, 'w-16 h-16 text-xl shadow-md')
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                      {activeRoomTitle.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Group / Direct Name & Rename Button (Pencil Icon ✎) */}
                  <div className="flex items-center gap-1 justify-center">
                    <h4 className="font-bold text-sm text-slate-900">{activeRoomTitle}</h4>
                    {!activeRoom.isDirect && (
                      <button
                        onClick={() => {
                          setEditRoomNameInput(activeRoom.name);
                          setShowRenameRoomModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                        title="Đổi tên nhóm (Click vào để đổi tên)"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
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

                  {!activeRoom.isDirect ? (
                    <button
                      onClick={handleOpenMembersModal}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px]">Thêm TV</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAddFriendModal(true)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px]">Bạn bè</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowGroupSettingsModal(true)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                    title="Mở Quản lý nhóm & Đổi tên nhóm"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 flex items-center justify-center text-slate-700 hover:text-blue-600">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold">Quản lý</span>
                  </button>
                </div>
              </div>

              {/* Members List Collapsible Section (Group Only) */}
              {!activeRoom.isDirect && (
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

                  <div className="space-y-2">
                    {(activeRoom.allowed_emails || []).slice(0, 4).map((emailStr, idx) => {
                      const isOwner = emailStr.toLowerCase() === activeRoom.created_by.toLowerCase();
                      const isVice = (activeRoom.vice_admins || []).some(
                        (v) => v.toLowerCase() === emailStr.toLowerCase()
                      );

                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            {renderUserAvatar(emailStr, undefined, 'w-6 h-6 text-[10px]')}
                            <span className="text-slate-700 truncate">
                              {getDisplayNameForEmail(emailStr)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Direct Message Button */}
                            {emailStr.toLowerCase() !== user?.email?.toLowerCase() && (
                              <button
                                onClick={() => handleStartDirectChat(emailStr)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Nhắn tin riêng 1-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group News & Attachments Collapsible Section */}
              <div className="p-4 border-b border-slate-100 space-y-3">
                <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Ảnh/Video & File đã gửi</span>
                </h5>
                <p className="text-[11px] text-slate-400 italic">Chưa có file phương tiện nào.</p>
              </div>
            </div>

            {/* Bottom Disband / Delete Action Button */}
            <div className="p-4 border-t border-slate-100 mt-auto">
              {isRoomOwner(activeRoom, user?.email) ? (
                <button
                  onClick={() => setShowDeleteRoomModal(true)}
                  className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{activeRoom.isDirect ? 'Xóa cuộc trò chuyện' : 'Giải tán nhóm'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleRemoveMember(user?.email || '')}
                  className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Rời khỏi nhóm</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Rename Room Modal */}
      {showRenameRoomModal && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowRenameRoomModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Edit2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Đổi tên nhóm</h3>
                <p className="text-xs text-slate-500">Cập nhật tên mới cho nhóm chat này</p>
              </div>
            </div>

            <form onSubmit={handleRenameRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Tên nhóm mới
                </label>
                <input
                  type="text"
                  required
                  value={editRoomNameInput}
                  onChange={(e) => setEditRoomNameInput(e.target.value)}
                  placeholder="Ví dụ: HOLDING SHK - KẾ TOÁN..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenameRoomModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu tên nhóm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Friend Modal (+👤) */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowAddFriendModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Thêm bạn mới</h3>
                <p className="text-xs text-slate-500">Nhập email đồng nghiệp/bạn bè để nhắn tin riêng 1-1</p>
              </div>
            </div>

            {addFriendSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{addFriendSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddFriend} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Email bạn bè / đồng nghiệp
                </label>
                <input
                  type="email"
                  required
                  value={addFriendEmailInput}
                  onChange={(e) => setAddFriendEmailInput(e.target.value)}
                  placeholder="Ví dụ: fica.holding@gmail.com..."
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFriendModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Kết bạn ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Settings Modal (Zalo Style Quản lý nhóm) */}
      {showGroupSettingsModal && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowGroupSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Quản lý nhóm</h3>
                <p className="text-xs text-slate-500">{activeRoom.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Management Features */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cấu hình nhóm
                </p>

                {/* Rename Group Item */}
                {!activeRoom.isDirect && (
                  <button
                    onClick={() => {
                      setShowGroupSettingsModal(false);
                      setEditRoomNameInput(activeRoom.name);
                      setShowRenameRoomModal(true);
                    }}
                    className="w-full p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left flex items-center justify-between text-xs font-semibold text-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Edit2 className="w-4 h-4 text-blue-600" />
                      <span>Đổi tên nhóm</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowGroupSettingsModal(false);
                    handleOpenMembersModal();
                  }}
                  className="w-full p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left flex items-center justify-between text-xs font-semibold text-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Quản lý thành viên & Bổ nhiệm Phó nhóm</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Danger Zone */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">
                  Khu vực nguy hiểm
                </p>

                {isRoomOwner(activeRoom, user?.email) ? (
                  <button
                    onClick={() => {
                      setShowGroupSettingsModal(false);
                      setShowDeleteRoomModal(true);
                    }}
                    className="w-full p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-left flex items-center justify-between text-xs font-bold text-red-600 transition shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>
                        {activeRoom.isDirect ? 'Xóa cuộc trò chuyện' : 'Giải tán nhóm (Xóa toàn bộ)'}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowGroupSettingsModal(false);
                      handleRemoveMember(user?.email || '');
                    }}
                    className="w-full p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-left flex items-center justify-between text-xs font-bold text-red-600 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>Rời khỏi nhóm</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile & Avatar Upload Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Cập nhật Hồ sơ cá nhân</h3>
                <p className="text-xs text-slate-500">Đổi Tên hiển thị và Ảnh đại diện Avatar</p>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Avatar Upload Picker */}
              <div className="flex flex-col items-center gap-3 py-2">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarSelect}
                  accept="image/*"
                  className="hidden"
                />

                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  {avatarPreview || avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarPreview || avatarUrl || ''}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-full object-cover border-4 border-blue-500 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center border-4 border-blue-100 shadow-md">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh mới lên</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Email tài khoản
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Tên hiển thị mới
                </label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="Ví dụ: Trịnh Huy, Sếp Hùng..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Lưu thay đổi</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <h3 className="font-bold text-slate-900 text-lg">
                {activeRoom.isDirect ? 'Xác nhận xóa cuộc trò chuyện' : 'Xác nhận giải tán nhóm'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Bạn có chắc chắn muốn {activeRoom.isDirect ? 'xóa cuộc trò chuyện' : 'giải tán'}{' '}
              <strong className="text-slate-900">{activeRoomTitle}</strong>? Tất cả dữ liệu sẽ bị xóa hoàn toàn.
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
                {deleteRoomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Xóa ngay</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Management & Vice Admin Modal */}
      {showMembersModal && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200 font-sans">
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
                <p className="text-xs text-slate-500">{activeRoomTitle}</p>
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
                      {renderUserAvatar(member.user_email, undefined, 'w-7 h-7 text-xs')}
                      <span className="text-slate-800 font-semibold truncate">
                        {getDisplayNameForEmail(member.user_email)} ({member.user_email})
                      </span>

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
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Direct 1-on-1 Chat Button */}
                        <button
                          type="button"
                          onClick={() => handleStartDirectChat(member.user_email)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="Nhắn tin riêng 1-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat riêng</span>
                        </button>

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

            {/* Bottom Disband Button for Room Owner */}
            {isRoomOwner(activeRoom, user?.email) && (
              <div className="pt-4 border-t border-slate-200 mt-4">
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setShowDeleteRoomModal(true);
                  }}
                  className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Giải tán nhóm này</span>
                </button>
              </div>
            )}
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
