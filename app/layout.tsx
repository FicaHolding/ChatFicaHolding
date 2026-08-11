import type { Metadata, Viewport } from 'next';
import './globals.css';
import RegisterSW from './components/RegisterSW';

export const metadata: Metadata = {
  title: 'Fica Chat - Realtime App',
  description: 'Ứng dụng trò chuyện thời gian thực Fica Holding',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fica Chat',
  },
  icons: {
    icon: '/icon.jpg',
    apple: '/apple-touch-icon.jpg',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
