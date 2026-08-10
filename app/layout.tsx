import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fica Chat - Realtime Chat App',
  description: 'Ứng dụng Chat tối thiểu với Next.js App Router và Supabase',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
