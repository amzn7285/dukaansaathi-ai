
"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectivityBannerProps {
  language: "hi-IN" | "en-IN";
}

export default function ConnectivityBanner({ language }: ConnectivityBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showSyncing, setShowSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowSyncing(true);
      setTimeout(() => setShowSyncing(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowSyncing(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const texts = {
    "hi-IN": {
      offline: "ऑफलाइन — डेटा सुरक्षित है",
      online: "वापस ऑनलाइन — डेटा सिंक हो रहा है"
    },
    "en-IN": {
      offline: "Offline — Data Saved",
      online: "Wapas Online — Data Sync Ho Raha Hai"
    }
  }[language];

  if (!isOnline) {
    return (
      <div className="bg-[#C45000] text-white px-4 py-1 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 z-[100]">
        <WifiOff size={14} className="animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">{texts.offline}</span>
      </div>
    );
  }

  if (showSyncing) {
    return (
      <div className="bg-[#1A6B3C] text-white px-4 py-1 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 z-[100]">
        <CheckCircle2 size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">{texts.online}</span>
      </div>
    );
  }

  return null;
}
