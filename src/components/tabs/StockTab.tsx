"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Volume2, Plus, AlertTriangle, Mic, Loader2, CheckCircle2, X, ShoppingCart, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

export default function StockTab({ role, language, stock, onAddCategory, sales, profile }: StockTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempResult, setTempResult] = useState<any>(null);
  const { toast } = useToast();

  const isHelper = role === "helper";
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.onresult = (e: any) => {
          const query = e.results[0][0].transcript;
          handleVoiceAdd(query);
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const parseStockLocally = (text: string) => {
    const qtyMatch = text.match(/(\d+(\.\d+)?)/);
    const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
    
    const unitsMap: Record<string, string[]> = {
      kg: ['kg', 'kilo', 'किलो'],
      L: ['litre', 'liter', 'लीटर', 'l'],
      units: ['piece', 'pcs', 'पीस', 'packet', 'पैकेट', 'unit', 'यूनिट', 'bottle', 'बोतल', 'tablet'],
      m: ['meter', 'मीटर'],
      gm: ['gram', 'ग्राम', 'gm']
    };

    let unit = language === 'hi-IN' ? 'यूनिट' : 'units';
    for (const [key, aliases] of Object.entries(unitsMap)) {
      if (aliases.some(a => text.toLowerCase().includes(a))) {
        unit = key === 'units' && language === 'hi-IN' ? 'यूनिट' : key;
        break;
      }
    }

    let cleanName = text.replace(/(\d+(\.\d+)?)/, '').trim();
    Object.values(unitsMap).flat().forEach(u => {
      const reg = new RegExp(`\\b${u}\\b`, 'gi');
      cleanName = cleanName.replace(reg, '');
    });
    
    cleanName = cleanName
      .replace(/mera|mere|paas|hai|है|I have|add|जोड़ो|सहेजें/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const name = cleanName || text;

    return {
      name: name,
      hiName: name,
      qty: qty,
      unit: unit,
      price: 0,
      emoji: name.toLowerCase().includes('milk') ? '🥛' : 
             name.toLowerCase().includes('rice') ? '🌾' : 
             name.toLowerCase().includes('oil') ? '🛢️' : '📦'
    };
  };

  const handleVoiceAdd = (query: string) => {
    if (isHelper) return;
    
    const parsed = parseStockLocally(query);
    setTempResult(parsed);
    
    setTimeout(() => {
      onAddCategory({
        ...parsed,
        id: Date.now(),
        level: 100,
        maxQty: parsed.qty,
        lowStockLevel: parsed.qty * 0.2
      });
      setTempResult(null);
      setIsDialogOpen(false);
      speak(language === 'hi-IN' ? `${parsed.name} जोड़ दिया गया है` : `${parsed.name} added successfully`);
    }, 1500);
  };

  const speakStockStatus = (item: any) => {
    const name = language === 'hi-IN' ? (item.hiName || item.name) : item.name;
    const qty = item.qty;
    const unit = item.unit;
    const level = item.level;

    let mood = "";
    if (level < 15) {
      mood = language === 'hi-IN' ? "— जल्दी ऑर्डर करो!" : "— Order soon!";
    } else if (level < 30) {
      mood = language === 'hi-IN' ? "— ध्यान रखो।" : "— Keep an eye.";
    } else {
      mood = language === 'hi-IN' ? "— ठीक है।" : "— Everything is fine.";
    }

    const text = language === 'hi-IN' 
      ? `${name} ${qty} ${unit} बचा है ${mood}`
      : `${name} ${qty} ${unit} left ${mood}`;
    
    speak(text);
  };

  const handleOrderStock = (item: any) => {
    if (isHelper) return;
    if (!profile?.supplierPhone) {
      toast({
        variant: "destructive",
        title: language === 'hi-IN' ? "सप्लायर का नंबर नहीं है" : "Missing Supplier Number",
        description: language === 'hi-IN' ? "कृपया सेटिंग्स में सप्लायर का WhatsApp नंबर जोड़ें।" : "Please add a Supplier WhatsApp number in Settings first.",
      });
      return;
    }

    const itemName = language === 'hi-IN' ? (item.hiName || item.name) : item.name;
    const shopName = profile?.shopName || "BolVyaapar Shop";
    const suggestedQty = item.maxQty || 10;
    
    const message = language === 'hi-IN'
      ? `नमस्ते, मैं ${shopName} से बोल रहा हूँ। हमें ${itemName} के ${suggestedQty} ${item.unit} की ज़रूरत है। कृपया जल्दी भेज दें। धन्यवाद!`
      : `Hi, this is ${shopName}. We need a reorder of ${suggestedQty} ${item.unit} of ${itemName}. Please deliver it soon. Thanks!`;

    window.open(`https://wa.me/${profile.supplierPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const texts = {
    "hi-IN": {
      title: "स्टॉक की स्थिति",
      addBtn: "नया सामान",
      voiceInstr: "सामान का नाम और मात्रा बोलें",
      example: "जैसे: '10 किलो चावल'",
      confirm: "हाँ, जोड़ो",
      cancel: "हटाओ",
      saved: "सहेज लिया गया",
      critical: "कम है",
      healthy: "ठीक है",
      orderNow: "📦 ऑर्डर करें",
      suno: "सुनो"
    },
    "en-IN": {
      title: "Stock Status",
      addBtn: "Add Item",
      voiceInstr: "Speak item name and quantity",
      example: "e.g. '10kg Rice'",
      confirm: "Yes, Add",
      cancel: "Cancel",
      saved: "Saved Successfully",
      critical: "Critical",
      healthy: "Healthy",
      orderNow: "📦 Order Now",
      suno: "Listen"
    }
  }[language];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{texts.title}</h3>
        
        {!isHelper && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setTempResult(null);
          }}>
            <DialogTrigger asChild>
              <button className="h-14 px-6 bg-[#C45000] text-white rounded-[24px] flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-[#C45000]/20 active:scale-95 transition-all">
                <Plus size={20} /> {texts.addBtn}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] rounded-[40px] p-8 border-none shadow-2xl bg-[#0D2240] text-white">
              <div className="flex flex-col items-center text-center space-y-8">
                {!tempResult ? (
                  <>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black">{texts.addBtn}</h2>
                      <p className="text-white/60">{texts.voiceInstr}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsListening(true);
                        recognitionRef.current?.start();
                      }}
                      className={cn(
                        "h-32 w-32 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
                        isListening ? "bg-red-500 animate-pulse" : "bg-[#C45000]"
                      )}
                    >
                      <Mic size={48} />
                    </button>
                    <p className="text-white/40 text-sm italic">{texts.example}</p>
                  </>
                ) : (
                  <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-8 rounded-[40px] w-full animate-in zoom-in-95">
                    <div className="text-7xl mb-4">{tempResult.emoji}</div>
                    <div className="space-y-2">
                      <p className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} /> {texts.saved}
                      </p>
                      <h2 className="text-4xl font-black text-white">{language === 'hi-IN' ? tempResult.hiName : tempResult.name}</h2>
                      <p className="text-2xl font-bold text-white/80">{tempResult.qty} {tempResult.unit}</p>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {stock.map((item) => {
          const isRed = item.level < 15;
          const isYellow = !isRed && item.level < 30;
          const isGreen = item.level >= 50;

          return (
            <Card key={item.id} className={cn(
              "rounded-[40px] overflow-hidden shadow-lg transition-all border-4 bg-white",
              isRed ? "border-red-500" : isYellow ? "border-amber-400" : isGreen ? "border-emerald-500" : "border-slate-100"
            )}>
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="text-7xl relative">
                    {item.emoji}
                    {isRed && (
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 animate-flash ring-4 ring-white shadow-xl">
                        <AlertTriangle size={20} fill="currentColor" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                      {language === 'hi-IN' ? (item.hiName || item.name) : item.name}
                    </h3>
                    <div className={cn(
                      "text-6xl font-black flex items-baseline justify-center gap-2",
                      isRed ? "text-red-600" : isYellow ? "text-amber-500" : isGreen ? "text-emerald-600" : "text-slate-900"
                    )}>
                      {item.qty}
                      <span className="text-xl font-bold text-slate-400 uppercase">{item.unit}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <Progress 
                      value={item.level} 
                      className={cn(
                        "h-4 rounded-full bg-slate-100",
                        isRed ? "[&>div]:bg-red-500" : isYellow ? "[&>div]:bg-amber-400" : isGreen ? "[&>div]:bg-emerald-500" : ""
                      )} 
                    />
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest px-1">
                      <span className={isRed ? "text-red-600" : "text-slate-400"}>{texts.critical}</span>
                      <span className={isGreen ? "text-emerald-600" : "text-slate-400"}>{texts.healthy}</span>
                    </div>
                  </div>

                  <div className={cn("grid gap-4 w-full", isRed && !isHelper ? "grid-cols-2" : "grid-cols-1")}>
                    <button 
                      onClick={() => speakStockStatus(item)}
                      className={cn(
                        "w-full h-20 rounded-[30px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-md",
                        isRed ? "bg-red-50 text-red-600 border-2 border-red-100" : "bg-slate-50 text-slate-600 border-2 border-slate-100"
                      )}
                    >
                      <Volume2 size={32} />
                      <span className="text-xl font-black uppercase tracking-widest">{texts.suno}</span>
                    </button>

                    {isRed && !isHelper && (
                      <button 
                        onClick={() => handleOrderStock(item)}
                        className="w-full h-20 rounded-[30px] bg-[#1A6B3C] text-white flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#1A6B3C]/20"
                      >
                        <ShoppingCart size={28} />
                        <span className="text-xl font-black uppercase tracking-widest">{texts.orderNow}</span>
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}