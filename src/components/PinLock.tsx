"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Mic, BookOpen } from "lucide-react";

interface PinLockProps {
  onAuth: (role: "owner" | "helper") => void;
  language: "hi-IN" | "en-IN";
  onLanguageChange: (lang: "hi-IN" | "en-IN") => void;
}

const LANGUAGES = [
  { code: "hi-IN", label: "🇮🇳 हिंदी", active: true },
  { code: "en-IN", label: "🇬🇧 English", active: true },
  { code: "te-IN", label: "తెలుగు", active: false },
  { code: "ta-IN", label: "தமிழ்", active: false },
];

export default function PinLock({ onAuth, language, onLanguageChange }: PinLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      if (newPin === "1234") {
        onAuth("owner");
      } else if (newPin === "5678") {
        onAuth("helper");
      } else {
        setTimeout(() => {
          setPin("");
          setError(true);
        }, 300);
      }
    }
  };

  const texts = {
    "hi-IN": {
      tagline: "बोलिये… बाकी सब BolVyapar संभालेगा",
      select: "भाषा चुनें",
      enter: "PIN दर्ज करें",
      error: "गलत PIN",
    },
    "en-IN": {
      tagline: "Boliye… Baaki Sab BolVyapar Sambhalega",
      select: "Select Language",
      enter: "Enter PIN",
      error: "Wrong PIN",
    }
  }[language];

  return (
    <div className="flex flex-col items-center justify-between h-full p-6 text-center bg-[#0D2240] overflow-y-auto">
      {/* Logo & Branding */}
      <div className="w-full max-w-sm flex flex-col items-center mt-12">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex items-center justify-center h-14 w-14 bg-white/10 rounded-2xl overflow-hidden backdrop-blur-md border border-white/20">
            <Mic size={24} className="text-[#C45000] absolute -translate-x-1.5" />
            <BookOpen size={24} className="text-[#1A6B3C] absolute translate-x-1.5" />
          </div>
          <div className="text-3xl font-black tracking-tight flex items-baseline">
            <span className="text-[#C45000]">Bol</span>
            <span className="text-[#1A6B3C]">Vyapar</span>
            <span className="text-[#FFB300] ml-1 text-base font-bold">AI 🇮🇳</span>
          </div>
        </div>
        <p className="text-white/70 text-sm font-medium italic mb-12 max-w-[200px] leading-relaxed">
          {texts.tagline}
        </p>
        
        {/* Language Selector */}
        <div className="w-full space-y-4 mb-8">
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">{texts.select}</p>
          <div className="grid grid-cols-2 gap-3 px-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                disabled={!lang.active}
                onClick={() => lang.active && onLanguageChange(lang.code as any)}
                className={cn(
                  "relative flex flex-col items-center justify-center h-20 rounded-[20px] border transition-all",
                  language === lang.code 
                    ? "border-[#C45000] bg-[#C45000]/10 ring-1 ring-[#C45000]" 
                    : "border-white/10 bg-white/5",
                  !lang.active && "opacity-20 grayscale cursor-not-allowed"
                )}
              >
                <span className="text-xl leading-none">{lang.label.split(' ')[0]}</span>
                <span className="text-[11px] font-bold text-white/80 mt-1">{lang.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PIN Entry */}
      <div className="w-full max-w-xs space-y-12 mb-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-5 h-5 rounded-full border-2 transition-all duration-300",
                  pin.length > i ? "bg-[#C45000] border-[#C45000] scale-125" : "border-white/20"
                )}
              />
            ))}
          </div>
          {error && <p className="text-destructive text-sm font-bold uppercase tracking-wider">{texts.error}</p>}
        </div>

        <div className="grid grid-cols-3 gap-y-6 gap-x-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(n.toString())}
              className="h-16 w-16 rounded-full bg-white/5 active:bg-[#C45000] transition-all text-2xl font-bold flex items-center justify-center border border-white/10 text-white mx-auto"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit("0")}
            className="h-16 w-16 rounded-full bg-white/5 active:bg-[#C45000] transition-all text-2xl font-bold flex items-center justify-center border border-white/10 text-white mx-auto"
          >
            0
          </button>
          <button
            onClick={() => setPin(pin.slice(0, -1))}
            className="h-16 w-16 rounded-full flex items-center justify-center text-white/40 mx-auto"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
