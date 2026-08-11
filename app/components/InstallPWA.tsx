'use client';

import { useEffect, useState } from 'react';
import { Smartphone, X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If standalone mode already, don't show banner
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner && !isIOS) return null;

  return (
    <div className="bg-indigo-600/90 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs border-b border-indigo-500/40 backdrop-blur-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
          <Smartphone className="w-4 h-4 text-white" />
        </div>
        <div className="truncate">
          <p className="font-semibold truncate">Thêm Fica Chat vào màn hình chính điện thoại</p>
          <p className="text-[10px] opacity-90 truncate">
            {isIOS
              ? 'Bấm nút Chia sẻ (Share) ➔ chọn "Thêm vào MH chính"'
              : 'Thêm icon app để sử dụng full màn hình như ứng dụng cài từ App Store'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="px-3 py-1 bg-white text-indigo-700 font-bold rounded-lg hover:bg-slate-100 transition shadow-sm flex items-center gap-1 text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải App</span>
          </button>
        )}
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition opacity-80 hover:opacity-100"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
