'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/lib/types';
import {
  Send,
  LogOut,
  Image as ImageIcon,
  Paperclip,
  Smile,
  X,
  FileText,
  MessageSquare,
  User,
  Download,
  Loader2,
} from 'lucide-react';

const COMMON_EMOJIS = ['😊', '😂', '😍', '👍', '🔥', '🎉', '❤️', '🙌', '😎', '🚀', '✨', '💯'];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

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

  // Initial load: User session & Fetch existing messages
  useEffect(() => {
    const initChat = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Fetch initial messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }

      setLoading(false);

      // Setup Realtime subscription
      const channel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages((prev) => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initChat();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
    let uploadedFileType: 'image' | 'file' | null = fileType;

    try {
      // Handle file upload if any
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Insert message into Postgres DB
      const { error: insertError } = await supabase.from('messages').insert({
        user_id: user.id,
        user_email: user.email,
        content: inputText.trim(),
        file_url: uploadedFileUrl,
        file_type: uploadedFileType,
      });

      if (insertError) {
        console.error('Lỗi gửi tin nhắn:', insertError);
        alert('Gửi tin nhắn thất bại: ' + insertError.message);
      } else {
        setInputText('');
        handleClearFile();
      }
    } catch (err: any) {
      console.error('Lỗi:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span>Đang tải phòng chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 max-w-5xl mx-auto w-full border-x border-slate-800 shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Phòng Chat Chung</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Realtime Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-300">
            <User className="w-4 h-4 text-indigo-400" />
            <span className="max-w-[180px] truncate">{user?.email}</span>
          </div>

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

      {/* Messages Feed */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
            <MessageSquare className="w-12 h-12 stroke-[1.5]" />
            <p>Chưa có tin nhắn nào. Hãy mở đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[11px] text-slate-400 px-1">
                  {isMe ? 'Bạn' : msg.user_email} •{' '}
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
            placeholder="Nhập tin nhắn..."
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
  );
}
