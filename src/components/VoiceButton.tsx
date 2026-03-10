"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAPPINGS_KEY = "bolvyaapar_product_mappings";

interface VoiceButtonProps {
  role: "owner" | "helper";
  language: "hi-IN" | "en-IN";
  privateMode: boolean;
  onTransactionSuccess: (txn: any) => void;
  businessType?: string;
  stock?: any[];
  khata?: any[];
  compact?: boolean;
}

export default function VoiceButton({ role, language, privateMode, onTransactionSuccess, businessType = "kirana", stock = [], khata = [], compact }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [learnedMappings, setLearnedMappings] = useState<Record<string, { category: string; count: number }>>({});
  const [pendingTxn, setPendingTxn] = useState<any>(null);
  const [autoConfirmTimer, setAutoConfirmTimer] = useState<number | null>(null);
  const [isAskingClarification, setIsAskingClarification] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  const isHelper = role === "helper";
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MAPPINGS_KEY);
    if (saved) try { setLearnedMappings(JSON.parse(saved)); } catch (e) { console.error(e); }

    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const query = e.results[0][0].transcript;
      if (isAskingClarification) handleClarificationResponse(query);
      else processQuery(query);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
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
    try { recognitionRef.current?.start(); } catch (e) { setIsListening(false); }
  };

  const processQuery = async (query: string) => {
    if (!query.trim()) return;
    setIsProcessing(true);

    if (!navigator.onLine) {
      const qtyMatch = query.match(/(\d+(\.\d+)?)/);
      const localQty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
      const unitMatch = query.match(/\b(kg|kilo|किलो|litre|liter|L|gram|gm|piece|pcs|bottle|packet)\b/i);
      const localUnit = unitMatch ? unitMatch[1] : '';
      const localName = query.replace(/\b(sold|becha|diya|बेचा)\b/gi, '').replace(/(\d+(\.\d+)?)\s*(kg|kilo|किलो|litre|liter|piece|pcs|bottle|packet)?/gi, '').trim() || query;
      finalizeTransaction({ 
        spokenResponse: language === "hi-IN" ? "बिक्री दर्ज हो गई" : "Sale recorded", 
        productName: localName, 
        price: 0, 
        quantity: localQty, 
        unit: localUnit, 
        intent: "sale" 
      });
      setIsProcessing(false);
      return;
    }

    try {
      const stockCategories = stock.map(s => s.name).join(", ");
      const khataNames = khata.map(c => c.name).join(", ");
      const systemPrompt = `You are BolVyaapar AI assistant for an Indian ${businessType} shop owner.
Parse the voice command and return ONLY a raw JSON object. No explanation. No markdown. No extra text. Just JSON.
Stock items available: ${stockCategories || "none"}. Known credit customers: ${khataNames || "none"}.
Language for spokenResponse: ${language === "hi-IN" ? "Hindi" : "English"}.
JSON format: {"intent":"sale","spokenResponse":"brief confirm in Hindi/English","productName":"exact item name","customerName":"","price":0,"quantity":1,"unit":"","description":"","advance":0,"message":"","suggestedCategory":"matching stock item name or empty"}
Intent must be one of: sale, expense, credit, payment, job_create, job_complete, reminder.
IMPORTANT: Extract quantity and unit accurately. Example: 'sold rice 5 kg' = quantity:5, unit:'kg', productName:'rice'`;

      const response = await fetch("/api/chat", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ userMessage: query, systemPrompt }) 
      });
      const data = await response.json();
      const jsonMatch = data.reply?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        handleTransactionResult(JSON.parse(jsonMatch[0]));
      } else {
        const qtyMatch = query.match(/(\d+(\.\d+)?)/);
        const localQty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
        finalizeTransaction({ 
          spokenResponse: language === "hi-IN" ? "बिक्री दर्ज हो गई" : "Sale recorded", 
          productName: query, 
          price: 0, 
          quantity: localQty, 
          intent: "sale" 
        });
      }
    } catch (err) {
      speak(language === "hi-IN" ? "गड़बड़ हो गई, फिर कोशिश करें" : "Something went wrong, try again");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransactionResult = (txn: any) => {
    if (isHelper && txn.intent !== "sale") {
      speak(language === "hi-IN" ? "सिर्फ बिक्री की अनुमति है।" : "Sales only allowed.");
      return;
    }
    if (txn.intent === "sale") {
      const mapping = learnedMappings[txn.productName?.toLowerCase()];
      if (mapping?.count >= 3) {
        txn.matchedCategory = mapping.category;
      } else if (txn.suggestedCategory && !txn.matchedCategory) {
        setPendingTxn(txn);
        setSuggestedCategory(txn.suggestedCategory);
        setIsAskingClarification(true);
        speak(language === "hi-IN" ? `${txn.productName} ${txn.suggestedCategory} में से गया?` : `Is ${txn.productName} from ${txn.suggestedCategory}?`);
        setTimeout(() => startListening(), 800);
        return;
      }
    }
    finalizeTransaction(txn);
  };

  const handleClarificationResponse = (query: string) => {
    const isYes = query.toLowerCase().includes("haan") || query.toLowerCase().includes("yes") || query.toLowerCase().includes("हाँ");
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
    setPendingTxn(null);
  };

  const finalizeTransaction = (txn: any) => {
    setPendingTxn(txn);
    if (navigator.onLine && txn?.spokenResponse) speak(txn.spokenResponse);
    let timeLeft = 5;
    setAutoConfirmTimer(timeLeft);
    const interval = setInterval(() => {
      timeLeft -= 1;
      setAutoConfirmTimer(timeLeft);
      if (timeLeft <= 0) { 
        clearInterval(interval); 
        confirmTransaction(txn); 
      }
    }, 1000);
    (window as any)._pendingInterval = interval;
  };

  const confirmTransaction = (txn: any) => {
    clearInterval((window as any)._pendingInterval);
    onTransactionSuccess(txn);
    setPendingTxn(null);
    setAutoConfirmTimer(null);
  };

  const cancelTransaction = () => {
    clearInterval((window as any)._pendingInterval);
    setPendingTxn(null);
    setAutoConfirmTimer(null);
    speak(language === "hi-IN" ? "रद्द कर दिया" : "Cancelled");
  };

  const texts = {
    "hi-IN": { wrong: "गलत ❌", right: "सही है ✅", auto: "ऑटो कन्फर्म", ready: "तैयार", order: "नया ऑर्डर", remind: "रिमाइंडर", owner: "मालिक", bal: "बाकी", adv: "एडवांस" },
    "en-IN": { wrong: "Wrong ❌", right: "Correct ✅", auto: "Auto Confirm", ready: "Ready", order: "New Order", remind: "Reminder", owner: "Owner", bal: "Balance", adv: "Advance" }
  }[language];

  if (pendingTxn && !isAskingClarification) {
    const isJob = pendingTxn.intent === "job_create";
    const isJobComplete = pendingTxn.intent === "job_complete";
    const isReminder = pendingTxn.intent === "reminder";
    const isAdvance = (pendingTxn.advance || 0) > 0;

    return (
      <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center text-5xl">
                {isJob ? "🛠️" : isJobComplete ? "✅" : isReminder ? "🔔" : "🛍️"}
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#0D2240] uppercase tracking-tight">
                  {isJobComplete ? pendingTxn.customerName : isReminder ? (pendingTxn.customerName || texts.owner) : (pendingTxn.productName || pendingTxn.customerName)}
                </h2>
                <p className="text-lg font-black text-slate-400 mt-1">
                  {isJobComplete ? texts.ready : isJob ? texts.order : isReminder ? texts.remind : `${pendingTxn.quantity || ""} ${pendingTxn.unit || ""}`}
                </p>
                {isReminder && <p className="text-sm font-bold text-slate-500 mt-2 italic">"{pendingTxn.message}"</p>}
              </div>
            </div>

            {!isHelper && !isJobComplete && !isReminder && pendingTxn.price > 0 && (
              <div className="text-center">
                {isJob && isAdvance && <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest mb-1">{texts.adv}: ₹{pendingTxn.advance}</p>}
                <div className="text-5xl font-black text-[#C45000]">
                  ₹{isJob ? pendingTxn.price - (pendingTxn.advance || 0) : pendingTxn.price}
                  {isJob && <span className="text-sm ml-2 text-slate-400 uppercase">{texts.bal}</span>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button onClick={cancelTransaction} className="h-20 rounded-[28px] bg-red-50 text-red-600 font-black text-lg border-2 border-red-100 flex items-center justify-center">{texts.wrong}</button>
              <button onClick={() => confirmTransaction(pendingTxn)} className="h-20 rounded-[28px] bg-[#1A6B3C] text-white font-black text-lg shadow-xl flex items-center justify-center">{texts.right}</button>
            </div>
            <p className="text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">{texts.auto} {autoConfirmTimer}s</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={startListening}
        disabled={isProcessing}
        className={cn(
          "rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(56,189,248,0.4)] transition-all active:scale-90 border-4 border-white",
          compact ? "h-12 w-12" : "h-24 w-24",
          isListening ? "bg-red-500 animate-pulse" : "bg-[#38BDF8]",
          isProcessing && "bg-slate-400 cursor-wait"
        )}
      >
        {isProcessing ? <Loader2 className="text-white animate-spin" size={compact ? 20 : 40} /> : <Mic className="text-white" size={compact ? 22 : 40} />}
      </button>
      {isListening && (
        <p className="mt-1 text-[10px] font-black text-[#38BDF8] uppercase tracking-widest animate-pulse">
          {language === "hi-IN" ? "सुन रहा हूँ..." : "Listening..."}
        </p>
      )}
    </div>
  );
}