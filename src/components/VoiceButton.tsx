"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  role: "owner" | "helper";
  language: "hi-IN" | "en-IN";
  privateMode: boolean;
  onTransactionSuccess: (details: any) => void;
  businessType?: string;
  stock?: any[];
  khata?: any[];
  compact?: boolean;
}

const MAPPINGS_KEY = "bolvyapar_product_mappings";

export default function VoiceButton({ role, language, privateMode, onTransactionSuccess, businessType = "kirana", stock = [], khata = [], compact }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [learnedMappings, setLearnedMappings] = useState<Record<string, { category: string, count: number }>>({});
  const [pendingTxn, setPendingTxn] = useState<any>(null);
  const [autoConfirmTimer, setAutoConfirmTimer] = useState<number | null>(null);
  const [isAskingClarification, setIsAskingClarification] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  const isHelper = role === "helper";
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MAPPINGS_KEY);
    if (saved) try { setLearnedMappings(JSON.parse(saved)); } catch (e) { console.error(e); }

    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.onresult = (e: any) => {
          const query = e.results[0][0].transcript;
          if (isAskingClarification) handleClarificationResponse(query);
          else processQuery(query);
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, [language, isAskingClarification]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListening || isProcessing) return;
    if (!isAskingClarification) speak(language === "hi-IN" ? "बोलिए" : "Speak now");
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const processQuery = async (query: string) => {
    if (!query.trim()) return;
    setIsProcessing(true);

    if (!navigator.onLine) {
      finalizeTransaction({ spokenResponse: language === "hi-IN" ? "ऑफलाइन सेव" : "Saved Offline", productName: query, price: 0, intent: 'sale' });
      setIsProcessing(false);
      return;
    }

    try {
      const stockCategories = stock.map(s => s.name).join(", ");
      const khataNames = khata.map(c => c.name).join(", ");
      const systemPrompt = `Parse voice. 
Intents: 
1. sale (Retail sale)
2. expense (Business kharcha)
3. credit (Udhaar dena)
4. payment (Udhaar vapas lena)
5. job_create (Service job)
6. job_complete (Mark job ready)
7. reminder (Set a reminder for owner/customer - e.g. 'Ramesh ko kal yaad dilao' or 'Kal chawal mangana hai')

Context: ${businessType}. Stock: ${stockCategories}. Khata: ${khataNames}. 
For reminder: extract customerName, message, date (ISO string for the reminder date).

Return ONLY JSON: {"intent": "...", "spokenResponse": "...", "productName": "...", "customerName": "...", "price": 0, "quantity": 0, "unit": "...", "description": "...", "advance": 0, "message": "...", "date": "..."}`;

      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userMessage: query, systemPrompt }) });
      const data = await response.json();
      const jsonMatch = data.reply?.match(/\{[\s\S]*\}/);
      if (jsonMatch) handleTransactionResult(JSON.parse(jsonMatch[0]));
    } catch (err) {
      speak("Error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransactionResult = (txn: any) => {
    if (isHelper && txn.intent !== 'sale') {
      speak(language === "hi-IN" ? "सिर्फ सेल लिखें।" : "Sales only.");
      return;
    }
    
    if (txn.intent === 'sale') {
      const mapping = learnedMappings[txn.productName?.toLowerCase()];
      if (mapping?.count >= 3) {
        txn.matchedCategory = mapping.category;
      } else if (txn.suggestedCategory && !txn.matchedCategory) {
        setPendingTxn(txn);
        setSuggestedCategory(txn.suggestedCategory);
        setIsAskingClarification(true);
        speak(language === "hi-IN" ? `${txn.productName} ${txn.suggestedCategory} में है?` : `Is ${txn.productName} in ${txn.suggestedCategory}?`);
        setTimeout(() => startListening(), 800);
        return;
      }
    }

    finalizeTransaction(txn);
  };

  const handleClarificationResponse = (query: string) => {
    const isYes = query.toLowerCase().includes("haan") || query.toLowerCase().includes("yes");
    if (isYes && pendingTxn && suggestedCategory) {
      const key = pendingTxn.productName?.toLowerCase();
      const current = learnedMappings[key] || { category: suggestedCategory, count: 0 };
      const updated = { ...learnedMappings, [key]: { ...current, count: current.count + 1 } };
      setLearnedMappings(updated);
      localStorage.setItem(MAPPINGS_KEY, JSON.stringify(updated));
      pendingTxn.matchedCategory = suggestedCategory;
    }
    finalizeTransaction(pendingTxn);
    setIsAskingClarification(false);
  };

  const finalizeTransaction = (txn: any) => {
    setPendingTxn(txn);
    if (navigator.onLine) speak(txn.spokenResponse);
    let timeLeft = 5;
    setAutoConfirmTimer(timeLeft);
    const interval = setInterval(() => {
      timeLeft -= 1;
      setAutoConfirmTimer(timeLeft);
      if (timeLeft <= 0) { clearInterval(interval); confirmTransaction(txn); }
    }, 1000);
    (window as any)._pendingInterval = interval;
  };

  const confirmTransaction = (txn: any) => {
    clearInterval((window as any)._pendingInterval);
    onTransactionSuccess(txn);
    setPendingTxn(null);
    setAutoConfirmTimer(null);
  };

  if (pendingTxn && !isAskingClarification) {
    const isJob = pendingTxn.intent === 'job_create';
    const isJobComplete = pendingTxn.intent === 'job_complete';
    const isReminder = pendingTxn.intent === 'reminder';
    const isAdvance = (pendingTxn.advance || 0) > 0;
    
    return (
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="p-8 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-28 w-28 rounded-full bg-slate-50 flex items-center justify-center text-6xl">
                {isJob ? '🛠️' : isJobComplete ? '✅' : isReminder ? '🔔' : '🛍️'}
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#0D2240] uppercase tracking-tight">
                  {isJobComplete ? pendingTxn.customerName : isReminder ? (pendingTxn.customerName || 'Owner') : (pendingTxn.productName || pendingTxn.customerName)}
                </h2>
                <p className="text-xl font-black text-slate-400 mt-2">
                  {isJobComplete ? (language === 'hi-IN' ? 'काम हो गया' : 'Ready') : 
                   isJob ? (language === 'hi-IN' ? 'नया ऑर्डर' : 'New Order') : 
                   isReminder ? (language === 'hi-IN' ? 'याद दिलाना है' : 'Reminder') :
                   `${pendingTxn.quantity || ''} ${pendingTxn.unit || ''}`}
                </p>
                {isReminder && <p className="text-sm font-bold text-slate-500 mt-2 italic">"{pendingTxn.message}"</p>}
              </div>
            </div>
            {!isHelper && !isJobComplete && !isReminder && (pendingTxn.price > 0 || isAdvance) && (
              <div className="space-y-2 text-center">
                {isJob && isAdvance && (
                  <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">
                    Advance: ₹{pendingTxn.advance}
                  </p>
                )}
                <div className="text-5xl font-black text-secondary">
                  ₹{isJob ? (pendingTxn.price - (pendingTxn.advance || 0)) : pendingTxn.price}
                  {isJob && <span className="text-sm ml-2 text-slate-400 uppercase">Balance</span>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setPendingTxn(null)} className="h-20 rounded-[28px] bg-red-50 text-red-600 font-black text-lg uppercase border-2 border-red-100 flex flex-col items-center justify-center">
                <span>Galat</span>
              </button>
              <button onClick={() => confirmTransaction(pendingTxn)} className="h-20 rounded-[28px] bg-secondary text-white font-black text-lg uppercase shadow-xl flex flex-col items-center justify-center">
                <span>Sahi Hai</span>
              </button>
            </div>
            <div className="text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">Auto Confirm in {autoConfirmTimer}s</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button onClick={startListening} disabled={isProcessing} className={cn("h-24 w-24 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(196,80,0,0.4)] transition-all active:scale-90 border-4 border-white", isListening ? "bg-red-500 animate-pulse" : "bg-[#C45000]", isProcessing && "bg-slate-400")}>
        {isProcessing ? <Loader2 className="text-white animate-spin" size={40} /> : <Mic className="text-white" size={40} />}
      </button>
      <p className="mt-2 text-[11px] font-black text-[#C45000] uppercase tracking-tighter">
        {isListening ? "Listening..." : "Boliye"}
      </p>
    </div>
  );
}
