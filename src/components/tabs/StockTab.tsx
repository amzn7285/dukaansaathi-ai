
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Volume2, Plus, AlertTriangle, Mic, Loader2, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StockTabProps {
  language: "hi-IN" | "en-IN";
  stock: any[];
  onAddCategory: (category: any) => void;
  sales: any[];
  profile: any;
}

export default function StockTab({ language, stock, onAddCategory, sales, profile }: StockTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempResult, setTempResult] = useState<any>(null);

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

  const handleVoiceAdd = async (query: string) => {
    setIsProcessing(true);
    try {
      const systemPrompt = `Parse voice to create a new stock category. 
      Return ONLY JSON: {"name": "item name", "hiName": "Hindi name", "qty": number, "unit": "kg/L/units", "price": number, "emoji": "emoji"}`;
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: query, systemPrompt }),
      });

      const data = await response.json();
      const jsonMatch = data.reply?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setTempResult(parsed);
        speak(language === 'hi-IN' ? "क्या मैं इसे जोड़ दूँ?" : "Should I add this?");
      }
    } catch (e) {
      console.error(e);
      speak(language === 'hi-IN' ? "समझ नहीं आया, फिर से बोलें" : "Didn't catch that, try again");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAdd = () => {
    onAddCategory({
      ...tempResult,
      id: Date.now(),
      level: 100,
      maxQty: tempResult.qty,
      lowStockLevel: tempResult.qty * 0.2
    });
    setTempResult(null);
    setIsDialogOpen(false);
    speak(language === 'hi-IN' ? "जोड़ दिया गया है" : "Added successfully");
  };

  const speakStockStatus = (item: any) => {
    const name = language === 'hi-IN' ? item.hiName : item.name;
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

  const texts = {
    "hi-IN": {
      title: "इन्वेंट्री स्टेटस",
      addBtn: "नया सामान",
      voiceInstr: "सामान का नाम, मात्रा और कीमत बोलें",
      example: "जैसे: '10 किलो चावल 800 रुपये'",
      confirm: "हाँ, जोड़ो",
      cancel: "हटाओ",
      processing: "चेक कर रहा हूँ...",
      critical: "खत्म होने वाला",
      healthy: "ज्यादा है"
    },
    "en-IN": {
      title: "Stock Status",
      addBtn: "Add Item",
      voiceInstr: "Speak item name, quantity and price",
      example: "e.g. '10kg Rice for 800 rupees'",
      confirm: "Yes, Add",
      cancel: "Cancel",
      processing: "Processing...",
      critical: "Critical",
      healthy: "Healthy"
    }
  }[language];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{texts.title}</h3>
        
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
                    disabled={isProcessing}
                    className={cn(
                      "h-32 w-32 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
                      isListening ? "bg-red-500 animate-pulse" : "bg-[#C45000]",
                      isProcessing && "bg-slate-600"
                    )}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={48} /> : <Mic size={48} />}
                  </button>
                  <p className="text-white/40 text-sm italic">{texts.example}</p>
                </>
              ) : (
                <>
                  <div className="text-7xl mb-2">{tempResult.emoji}</div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black">{language === 'hi-IN' ? tempResult.hiName : tempResult.name}</h2>
                    <p className="text-2xl font-bold text-[#FFB300]">{tempResult.qty} {tempResult.unit} • ₹{tempResult.price}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full pt-4">
                    <Button onClick={() => setTempResult(null)} variant="outline" className="h-20 rounded-3xl border-white/10 bg-white/5 text-white text-xl font-black">
                      <X size={24} className="mr-2" /> {texts.cancel}
                    </Button>
                    <Button onClick={confirmAdd} className="h-20 rounded-3xl bg-emerald-500 text-white text-xl font-black hover:bg-emerald-600 shadow-xl shadow-emerald-500/20">
                      <CheckCircle2 size={24} className="mr-2" /> {texts.confirm}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
                      {language === 'hi-IN' ? item.hiName : item.name}
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

                  <button 
                    onClick={() => speakStockStatus(item)}
                    className={cn(
                      "w-full h-20 rounded-[30px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-lg",
                      isRed ? "bg-red-50 text-red-600 border-2 border-red-100" : "bg-slate-50 text-slate-600 border-2 border-slate-100"
                    )}
                  >
                    <Volume2 size={32} />
                    <span className="text-xl font-black uppercase tracking-widest">{language === 'hi-IN' ? 'सुनो' : 'Listen'}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
