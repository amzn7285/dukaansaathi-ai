"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Home, Package, BarChart3, BookOpen, Lock, Users, Eye, EyeOff, Volume2, X } from "lucide-react";
import DukaanTab from "./tabs/DukaanTab";
import StockTab from "./tabs/StockTab";
import SeekhaTab from "./tabs/SeekhaTab";
import ReportTab from "./tabs/ReportTab";
import CustomerView from "./CustomerView";
import VoiceButton from "./VoiceButton";
import { cn } from "@/lib/utils";

interface DashboardProps {
  role: "owner" | "helper";
  language: "hi-IN" | "en-IN";
  onLogout: () => void;
}

const SNOOZE_KEY = "bolvyapar_lesson_snooze";
const SNOOZE_DURATION = 3600000;

export default function Dashboard({ role, language, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dukaan");
  const [privateMode, setPrivateMode] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [showLessonCard, setShowLessonCard] = useState(false);

  const handleTransaction = (details: any) => {
    setLastTransaction(details);
  };

  const handleLessonGenerated = (lesson: string) => {
    const snoozeTime = localStorage.getItem(SNOOZE_KEY);
    if (snoozeTime && Date.now() - parseInt(snoozeTime) < SNOOZE_DURATION) return;
    setCurrentLesson(lesson);
    setTimeout(() => setShowLessonCard(true), 3000);
  };

  const speakLesson = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  if (showCustomerView) {
    return <CustomerView transaction={lastTransaction} onBack={() => setShowCustomerView(false)} language={language} />;
  }

  const texts = {
    "hi-IN": {
      dukaan: "दुकान",
      stock: "स्टॉक",
      report: "रिपोर्ट",
      seekha: "सीखा",
    },
    "en-IN": {
      dukaan: "Dukaan",
      stock: "Stock",
      report: "Report",
      seekha: "Seekha",
    }
  }[language];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      {/* Professional Fintech Header */}
      <header className="bg-[#0D2240] px-6 py-4 flex items-center justify-between shadow-2xl z-20 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="text-xl font-black flex items-baseline">
            <span className="text-[#C45000]">Bol</span>
            <span className="text-[#1A6B3C]">Vyapar</span>
            <span className="text-[#FFB300] ml-1 text-[10px] font-bold">AI 🇮🇳</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setPrivateMode(!privateMode)}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
              privateMode ? 'bg-[#C45000] text-white' : 'bg-white/5 text-white/40'
            )}
          >
            {privateMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button 
            onClick={() => setShowCustomerView(true)}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40"
          >
            <Users size={18} />
          </button>
          <button 
            onClick={onLogout}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40"
          >
            <Lock size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-48 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsContent value="dukaan" className="m-0 p-4">
            <DukaanTab privateMode={privateMode} language={language} />
          </TabsContent>
          <TabsContent value="stock" className="m-0 p-4">
            <StockTab language={language} />
          </TabsContent>
          <TabsContent value="report" className="m-0 p-4">
            <ReportTab role={role} privateMode={privateMode} language={language} />
          </TabsContent>
          <TabsContent value="seekha" className="m-0 p-4">
            <SeekhaTab language={language} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Passive Lesson Card */}
      {showLessonCard && !privateMode && !showCustomerView && currentLesson && (
        <div className="fixed bottom-28 left-4 right-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-full duration-500 z-50 flex items-center gap-4">
          <div className="text-3xl">📚</div>
          <div className="flex-1 space-y-3">
            <p className="text-[10px] font-black text-[#C45000] uppercase tracking-widest">New Lesson</p>
            <div className="flex gap-2">
              <button 
                onClick={() => { speakLesson(currentLesson!); setShowLessonCard(false); }}
                className="bg-[#1A6B3C] text-white h-12 flex-1 rounded-xl flex items-center justify-center gap-2 font-bold text-sm"
              >
                <Volume2 size={16} /> Suniye
              </button>
              <button 
                onClick={() => setShowLessonCard(false)}
                className="bg-slate-100 text-slate-500 h-12 w-12 rounded-xl flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fintech Style Bottom Navigation with Integrated Mic */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 pb-safe z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center max-w-md mx-auto relative h-16">
          <NavBtn icon={<Home size={22} />} label={texts.dukaan} active={activeTab === 'dukaan'} onClick={() => setActiveTab('dukaan')} />
          <NavBtn icon={<Package size={22} />} label={texts.stock} active={activeTab === 'stock'} onClick={() => setActiveTab('stock')} />
          
          {/* Raised Mic Button */}
          <div className="relative -top-8 flex flex-col items-center">
            <VoiceButton 
              language={language} 
              privateMode={privateMode} 
              onTransactionSuccess={handleTransaction} 
              onLessonGenerated={handleLessonGenerated}
              compact
            />
          </div>

          <NavBtn icon={<BarChart3 size={22} />} label={texts.report} active={activeTab === 'report'} onClick={() => setActiveTab('report')} disabled={role === 'helper'} />
          <NavBtn icon={<BookOpen size={22} />} label={texts.seekha} active={activeTab === 'seekha'} onClick={() => setActiveTab('seekha')} />
        </div>
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, disabled }: { icon: any, label: string, active: boolean, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 min-w-[64px] transition-all",
        active ? "text-[#C45000]" : "text-slate-400",
        disabled && "opacity-20"
      )}
    >
      <div className={cn("transition-transform", active && "scale-110")}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
      {active && <div className="w-1 h-1 rounded-full bg-[#C45000] mt-0.5" />}
    </button>
  );
}
