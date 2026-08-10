# ChatFicaHolding - Realtime Chat Web Application

Ứng dụng chat trực tuyến tối thiểu, tốc độ cao được xây dựng bằng **Next.js App Router**, **TypeScript**, và **Supabase** (Auth, Database, Storage, Realtime).

---

## 🚀 Tính Năng Chính

1. **Xác thực người dùng (Supabase Auth)**: Đăng ký, Đăng nhập, Đăng xuất với Cookie-based Sessions và Next.js Middleware Route Protection.
2. **Phòng Chat Chung (General Room)**: Nơi mọi thành viên đã đăng nhập cùng trò chuyện.
3. **Gửi & Nhận Tin Nhắn Văn Bản**: Hiển thị người gửi, thời gian, bong bóng chat phân biệt giữa "Bạn" và người dùng khác.
4. **Đính Kèm Hình Ảnh & File (Supabase Storage)**: Hỗ trợ gửi ảnh xem trực tiếp hoặc tải về file văn bản/tài liệu.
5. **Bộ Chọn Emoji**: Hỗ trợ chèn các emoji phổ biến nhanh chóng.
6. **Realtime Updates (Supabase Realtime)**: Cập nhật tin nhắn mới tức thì không cần tải lại trang.

---

## 🛠️ Hướng Dẫn Cài Đặt Local

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình Biến Môi Trường (`.env.local`)
Tạo file `.env.local` ở thư mục gốc project với nội dung:
```env
NEXT_PUBLIC_SUPABASE_URL=https://uvbdsvfabcxjereejisj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Thiết Lập Supabase Database & Storage
Vào [Supabase Dashboard](https://supabase.com/dashboard) ➔ Mở dự án của bạn ➔ Vào mục **SQL Editor** ➔ Copy toàn bộ nội dung file [`schema.sql`](./schema.sql) và nhấn **RUN**.

Nội dung `schema.sql` sẽ tự động:
- Tạo bảng `messages`
- Bật Row Level Security (RLS) & cấp quyền cho authenticated users
- Kích hoạt Supabase Realtime
- Tạo Bucket Storage `chat-attachments` công khai

### 4. Chạy Ứng Dụng Local
```bash
npm run dev
```
Mở trình duyệt tại địa chỉ: `http://localhost:3000`

---

## 📦 Deploy Lên Vercel

1. Push repository lên GitHub.
2. Truy cập [Vercel Dashboard](https://vercel.com) ➔ Chọn **Add New Project** ➔ Import repository GitHub của bạn.
3. Thêm các biến môi trường tại mục **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Bấm **Deploy**.
