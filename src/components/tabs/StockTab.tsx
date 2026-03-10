"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Volume2, Plus, AlertTriangle, Mic, ShoppingCart, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface StockTabProps {
  role: "owner" | "helper";
  language: "hi-IN" | "en-IN";
  stock: any[];
  onAddCategory: (category: any) => void;
  sales: any[];
  profile: any;
}

const guessEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (/rice|chawal|चावल/.test(n)) return '🌾';
  if (/milk|doodh|दूध/.test(n)) return '🥛';
  if (/oil|tel|तेल/.test(n)) return '🛢️';
  if (/wheat|atta|आटा|gehun|गेहूं/.test(n)) return '🌾';
  if (/sugar|chini|चीनी/.test(n)) return '🍚';
  if (/dal|daal|दाल/.test(n)) return '🫘';
  if (/soap|sabun|साबुन/.test(n)) return '🧼';
  if (/salt|namak|नमक/.test(n)) return '🧂';
  if (/tea|chai|चाय/.test(n)) return '🍵';
  if (/mobile|phone|screen/.test(n)) return '📱';
  if (/fabric|cloth|kapda|कपड़ा/.test(n)) return '🧵';
  if (/medicine|tablet|dawa|दवा/.test(n)) return '💊';
  if (/shampoo|hair/.test(n)) return '🧴';
  if (/battery/.test(n)) return '🔋';
  return '📦';
};

const extractProductName = (text: string): string => {
  return text
    .replace(/\d+(\.\d+)?\s*(kg|kilo|किलो|litre|liter|लीटर|piece|pcs|पीस|packet|पैकेट|bottle|बोतल|tablet|meter|मीटर|gram|ग्राम|gm|unit|यूनिट|l\b)/gi, '')
    .replace(/\b(mera|mere|paas|hai|हैं|है|ke|का|की|ko|add|jodo|जोड़ो|जोड़ें|dikhao|batao|mere paas|yahan|abhi|aaj)\b/gi, '')
    .replace(/\b(I have|i have|have|add|there is|stock|put|save|enter|record|today|now)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractQty = (text: string): number => {
  if (/sawa/i.test(text)) return 1.25;
  if (/dedh|dhed/i.test(text)) return 1.5;
  if (/dhai/i.test(text)) return 2.5;
  const match = text.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 1;
};

const extractUnit = (text: string, lang: string): string => {
  const t = text.toLowerCase();
  if (/\b(kg|kilo|किलो)\b/.test(t)) return 'kg';
  if (/\b(litre|liter|लीटर|litr)\b/.test(t)) return 'L';
  if (/\b(meter|मीटर|mtr)\b/.test(t)) return 'm';
  if (/\b(gram|ग्राम|gm|grm)\b/.test(t)) return 'gm';
  if (/\b(packet|पैकेट|pack)\b/.test(t)) return lang === 'hi-IN' ? 'पैकेट' : 'packet';
  if (/\b(bottle|बोतल)\b/.test(t)) return lang === 'hi-IN' ? 'बोतल' : 'bottle';
  if (/\b(tablet|टैबलेट)\b/.test(t)) return lang === 'hi-IN' ? 'टैबलेट' : 'tablet';
  if (/\b(piece|pcs|पीस|unit)\b/.test(t)) return lang === 'hi-IN' ? 'पीस' : 'pcs';
  return lang === 'hi-IN' ? 'यूनिट' : 'units';
};

export default function StockTab({ role, language, stock, onAddCategory, sales, profile }: StockTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [savedItem, setSavedItem] = useState<any>(null);
  const [manualText, setManualText] = useState("");
  const { toast } = useToast();

  const isHelper = role === "helper";
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = language;
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);
      if (e.results[e.results.length - 1].isFinal) saveFromText(text);
    };
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    recognitionRef.current = r;
  }, [language]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language;
    window.speechSynthesis.speak(u);
  };

  const saveFromText = (text: string) => {
    if (!text.trim()) return;

    const name = extractProductName(text) || text.trim();
    const qty = extractQty(text);
    const unit = extractUnit(text, language);
    const emoji = guessEmoji(name);

    const item = {
      id: Date.now(),
      name: name,
      hiName: name,
      qty: qty,
      unit: unit,
      emoji: emoji,
      level: 100,
      maxQty: qty,
      lowStockLevel: Math.max(1, qty * 0.2),
      price: 0,
    };

    setSavedItem(item);
    onAddCategory(item);
    speak(language === 'hi-IN' ? `${name} जोड़ दिया गया` : `${name} added`);

    setTimeout(() => {
      setSavedItem(null);
      setTranscript("");
      setManualText("");
      setShowAddModal(false);
    }, 1500);
  };

  const startListening = () => {
    if (isListening) return;
    setTranscript("");
    setIsListening(true);
    try { recognitionRef.current?.start(); } catch (e) { setIsListening(false); }
  };

  const speakStockStatus = (item: any) => {
    const name = language === 'hi-IN' ? (item.hiName || item.name) : item.name;
    let mood = "";
    if (item.level < 15) mood = language === 'hi-IN' ? "— जल्दी ऑर्डर करो!" : "— Order urgently!";
    else if (item.level < 30) mood = language === 'hi-IN' ? "— थोड़ा कम है।" : "— Running low.";
    else mood = language === 'hi-IN' ? "— ठीक है।" : "— Stock is fine.";
    speak(language === 'hi-IN' ? `${name} ${item.qty} ${item.unit} बचा है ${mood}` : `${name} ${item.qty} ${item.unit} left ${mood}`);
  };

  const handleOrderStock = (item: any) => {
    if (isHelper) return;
    if (!profile?.supplierPhone) {
      toast({ variant: "destructive", title: language === 'hi-IN' ? "सप्लायर का नंबर नहीं है" : "No Supplier Number", description: language === 'hi-IN' ? "सेटिंग्स में सप्लायर का WhatsApp नंबर जोड़ें।" : "Add supplier WhatsApp in Settings." });
      return;
    }
    const itemName = language === 'hi-IN' ? (item.hiName || item.name) : item.name;
    const shopName = profile?.shopName || "BolVyaapar Shop";
    const suggestedQty = item.maxQty || 10;
    const message = language === 'hi-IN'
      ? `नमस्ते, मैं ${shopName} से बोल रहा हूँ। हमें ${itemName} के ${suggestedQty} ${item.unit} की ज़रूरत है। कृपया जल्दी भेज दें। धन्यवाद!`
      : `Hi, this is ${shopName}. We need ${suggestedQty} ${item.unit} of ${itemName}. Please deliver soon. Thanks!`;
    window.open(`https://wa.me/${profile.supplierPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const isHi = language === 'hi-IN';

  return (
    <div className="space-y-6 pb-48">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          {isHi ? "स्टॉक की स्थिति" : "Stock Status"}
        </h3>
        {!isHelper && (
          <button
            onClick={() => { setShowAddModal(true); setSavedItem(null); setTranscript(""); }}
            className="h-14 px-6 bg-[#C45000] text-white rounded-[24px] flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            <Plus size={20} /> {isHi ? "नया सामान" : "Add Item"}
          </button>
        )}
      </div>

      {stock.length === 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-slate-400 font-bold">{isHi ? "कोई स्टॉक नहीं — नया सामान जोड़ें" : "No stock yet — tap Add Item"}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {stock.map((item) => {
          const isRed = item.level < 15;
          const isYellow = !isRed && item.level < 30;
          const isGreen = item.level >= 50;

          return (
            <Card key={item.id} className={cn(
              "rounded-[40px] overflow-hidden shadow-lg border-4 bg-white",
              isRed ? "border-red-500" : isYellow ? "border-amber-400" : "border-emerald-500"
            )}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="text-7xl relative">
                    {item.emoji || "📦"}
                    {isRed && (
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 animate-pulse ring-4 ring-white shadow-xl">
                        <AlertTriangle size={20} fill="currentColor" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                      {isHi ? (item.hiName || item.name) : item.name}
                    </h3>
                    <div className={cn(
                      "text-6xl font-black flex items-baseline justify-center gap-2",
                      isRed ? "text-red-600" : isYellow ? "text-amber-500" : "text-emerald-600"
                    )}>
                      {item.qty}
                      <span className="text-xl font-bold text-slate-400 uppercase">{item.unit}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2">
                    <Progress
                      value={item.level}
                      className={cn(
                        "h-4 rounded-full bg-slate-100",
                        isRed ? "[&>div]:bg-red-500" : isYellow ? "[&>div]:bg-amber-400" : "[&>div]:bg-emerald-500"
                      )}
                    />
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest px-1">
                      <span className={isRed ? "text-red-600" : "text-slate-300"}>{isHi ? "कम है" : "Critical"}</span>
                      <span className={isGreen ? "text-emerald-600" : "text-slate-300"}>{isHi ? "ठीक है" : "Healthy"}</span>
                    </div>
                  </div>

                  <div className={cn("grid gap-4 w-full", isRed && !isHelper ? "grid-cols-2" : "grid-cols-1")}>
                    <button
                      onClick={() => speakStockStatus(item)}
                      className="w-full h-20 rounded-[30px] bg-slate-50 text-slate-600 border-2 border-slate-100 flex items-center justify-center gap-4 active:scale-95"
                    >
                      <Volume2 size={32} />
                      <span className="text-xl font-black uppercase">{isHi ? "सुनो" : "Listen"}</span>
                    </button>
                    {isRed && !isHelper && (
                      <button
                        onClick={() => handleOrderStock(item)}
                        className="w-full h-20 rounded-[30px] bg-[#1A6B3C] text-white flex items-center justify-center gap-3 active:scale-95 shadow-lg"
                      >
                        <ShoppingCart size={28} />
                        <span className="text-xl font-black uppercase">{isHi ? "ऑर्डर करें" : "Order Now"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-[#0D2240] w-full max-w-md rounded-[40px] shadow-2xl p-8 space-y-8 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-white">{isHi ? "नया सामान जोड़ें" : "Add Item"}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                <X size={28} />
              </button>
            </div>

            {savedItem ? (
              <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-8 rounded-[32px] text-center animate-in zoom-in-95">
                <div className="text-6xl mb-3">{savedItem.emoji}</div>
                <p className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 size={14} /> {isHi ? "सहेज लिया गया" : "Saved"}
                </p>
                <h2 className="text-3xl font-black text-white">{savedItem.name}</h2>
                <p className="text-xl text-white/60 mt-1">{savedItem.qty} {savedItem.unit}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center space-y-4">
                  <button
                    onClick={startListening}
                    className={cn(
                      "h-32 w-32 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
                      isListening ? "bg-red-500 animate-pulse" : "bg-[#C45000]"
                    )}
                  >
                    <Mic size={48} className="text-white" />
                  </button>
                  {transcript ? (
                    <p className="text-[#38BDF8] font-black text-sm text-center animate-pulse">"{transcript}"</p>
                  ) : (
                    <p className="text-white/40 text-sm italic text-center">
                      {isHi ? "जैसे: '10 किलो चावल' या 'wheat 5 kg'" : "e.g. '10kg Rice' or '5 kilo atta'"}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Input
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && manualText.trim()) saveFromText(manualText); }}
                    placeholder={isHi ? "यहाँ लिखें..." : "Type here..."}
                    className="h-14 rounded-2xl bg-white/5 border-white/10 text-white flex-1"
                  />
                  <button
                    onClick={() => { if (manualText.trim()) saveFromText(manualText); }}
                    disabled={!manualText.trim()}
                    className="h-14 px-5 bg-[#38BDF8] text-[#0D2240] font-black rounded-2xl disabled:opacity-40"
                  >
                    {isHi ? "जोड़ें" : "Add"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
