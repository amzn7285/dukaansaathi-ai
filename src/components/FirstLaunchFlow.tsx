
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store, User, Phone, ShoppingBasket, Scissors, Wrench, Utensils, Truck, Pill, ScissorsLineDashed, Box, Mic, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FirstLaunchFlowProps {
  onComplete: () => void;
  language: "hi-IN" | "en-IN";
}

const BUSINESS_TYPES = [
  { id: 'kirana', emoji: '🏪', en: "Kirana General Store", hi: "किराना जनरल स्टोर" },
  { id: 'dhaba', emoji: '🍵', en: "Dhaba Food Stall", hi: "ढाबा फूड स्टाल" },
  { id: 'tailor', emoji: '✂️', en: "Tailor Boutique", hi: "दर्जी बुटीक" },
  { id: 'repair', emoji: '🔧', en: "Repair Shop", hi: "रिपेयर शॉप" },
  { id: 'milk', emoji: '🥛', en: "Milk Delivery", hi: "दूध की डिलीवरी" },
  { id: 'medical', emoji: '💊', en: "Medical Store", hi: "मेडिकल स्टोर" },
  { id: 'salon', emoji: '💇', en: "Salon Beauty", hi: "सैलून ब्यूटी" },
  { id: 'other', emoji: '📦', en: "Other Business", hi: "अन्य व्यापार" },
];

export default function FirstLaunchFlow({ onComplete, language }: FirstLaunchFlowProps) {
  const [step, setStep] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    shopName: "",
    ownerPhone: "",
    businessType: "",
    firstStock: null as any,
    firstSale: null as any
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.onresult = (e: any) => {
          const query = e.results[0][0].transcript;
          handleVoiceAction(query);
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, [language, step]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListening) return;
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const handleVoiceAction = async (query: string) => {
    setIsProcessing(true);
    try {
      let systemPrompt = "";
      if (step === 3) {
        systemPrompt = `Extract stock details from voice. Return ONLY JSON: {"name": "item", "qty": number, "unit": "kg/L/etc", "emoji": "emoji"}`;
      } else if (step === 4) {
        systemPrompt = `Extract sale details. Return ONLY JSON: {"productName": "item", "price": number, "quantity": number}`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: query, systemPrompt }),
      });

      const data = await response.json();
      const jsonMatch = data.reply?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (step === 3) {
          setFormData({ ...formData, firstStock: parsed });
          speak(language === 'hi-IN' ? "स्टॉक रिकॉर्ड हो गया" : "Stock recorded");
        } else if (step === 4) {
          setFormData({ ...formData, firstSale: parsed });
          speak(language === 'hi-IN' ? "बिक्री रिकॉर्ड हो गई" : "Sale recorded");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const finishSetup = () => {
    const finalProfile = {
      ...formData,
      ownerName: "Owner",
      businessType: formData.businessType || 'kirana'
    };
    localStorage.setItem("bolvyapar_profile", JSON.stringify(finalProfile));
    
    // Save initial stock
    if (formData.firstStock) {
      const stock = [{ ...formData.firstStock, id: Date.now(), level: 100, maxQty: formData.firstStock.qty, lowStockLevel: 10 }];
      localStorage.setItem("bolvyapar_stock_data", JSON.stringify(stock));
    }

    // Save initial sale
    if (formData.firstSale) {
      const sale = [{ ...formData.firstSale, id: Date.now(), timestamp: new Date().toISOString(), customer: "Customer" }];
      localStorage.setItem("bolvyapar_sales_history", JSON.stringify(sale));
    }

    onComplete();
  };

  const texts = {
    "hi-IN": {
      step1Title: "दुकान की जानकारी",
      step1Sub: "अपने व्यापार की शुरुआत करें",
      shopName: "दुकान का नाम",
      ownerPhone: "आपका WhatsApp नंबर",
      step2Title: "व्यापार का प्रकार",
      step2Sub: "एक विकल्प चुनें",
      step3Title: "स्टॉक जोड़ें",
      step3Sub: "बोलकर अपना पहला सामान जोड़ें",
      step3Instr: "जैसे: '10 किलो चावल है'",
      step4Title: "पहली बिक्री",
      step4Sub: "बोलकर पहली बिक्री दर्ज करें",
      step4Instr: "जैसे: '2 किलो चावल बेचा 100 रुपये में'",
      next: "अगला",
      finish: "शुरू करें",
      congrats: "बधाई हो!",
      congratsSub: "आपका सेटअप पूरा हो गया है"
    },
    "en-IN": {
      step1Title: "Shop Details",
      step1Sub: "Let's start your digital journey",
      shopName: "Shop Name",
      ownerPhone: "Your WhatsApp Number",
      step2Title: "Business Type",
      step2Sub: "Select your category",
      step3Title: "Add Stock",
      step3Sub: "Add your first item by voice",
      step3Instr: "e.g. 'I have 10kg Rice'",
      step4Title: "First Sale",
      step4Sub: "Record your first sale by voice",
      step4Instr: "e.g. 'Sold 2kg Rice for 100 rupees'",
      next: "Next",
      finish: "Get Started",
      congrats: "Congratulations!",
      congratsSub: "Your setup is complete"
    }
  }[language];

  return (
    <div className="fixed inset-0 bg-[#0D2240] z-[100] flex flex-col p-6 overflow-y-auto">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center space-y-8 py-12">
        
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">{texts.step1Title}</h1>
              <p className="text-white/60 font-medium">{texts.step1Sub}</p>
            </div>
            <Card className="bg-white/5 border-white/10 rounded-[32px]">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest">{texts.shopName}</Label>
                  <Input 
                    value={formData.shopName} 
                    onChange={e => setFormData({...formData, shopName: e.target.value})}
                    placeholder="e.g. Rahul General Store"
                    className="h-16 rounded-2xl bg-white/5 border-white/10 text-white text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest">{texts.ownerPhone}</Label>
                  <Input 
                    value={formData.ownerPhone} 
                    onChange={e => setFormData({...formData, ownerPhone: e.target.value})}
                    placeholder="91..."
                    className="h-16 rounded-2xl bg-white/5 border-white/10 text-white text-lg"
                  />
                </div>
                <Button 
                  disabled={!formData.shopName || !formData.ownerPhone}
                  onClick={() => setStep(2)}
                  className="w-full h-16 rounded-2xl bg-[#C45000] text-white font-black text-lg"
                >
                  {texts.next}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">{texts.step2Title}</h1>
              <p className="text-white/60 font-medium">{texts.step2Sub}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setFormData({...formData, businessType: type.id});
                    setStep(3);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all active:scale-95",
                    formData.businessType === type.id ? "bg-[#C45000] border-[#C45000]" : "bg-white/5 border-white/10"
                  )}
                >
                  <span className="text-4xl mb-3">{type.emoji}</span>
                  <span className="text-[11px] font-black text-white uppercase text-center leading-tight">
                    {language === 'hi-IN' ? type.hi : type.en}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">{texts.step3Title}</h1>
              <p className="text-white/60 font-medium">{texts.step3Sub}</p>
            </div>
            <div className="flex flex-col items-center space-y-8">
              <button 
                onClick={startListening}
                disabled={isProcessing}
                className={cn(
                  "h-32 w-32 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
                  isListening ? "bg-red-500 animate-pulse" : "bg-[#C45000]",
                  formData.firstStock && "bg-emerald-500"
                )}
              >
                {isProcessing ? <Loader2 className="text-white animate-spin" size={48} /> : 
                 formData.firstStock ? <CheckCircle2 className="text-white" size={48} /> : <Mic className="text-white" size={48} />}
              </button>
              <p className="text-white/40 text-sm italic">{texts.step3Instr}</p>
              {formData.firstStock && (
                <div className="bg-white/5 p-4 rounded-2xl border border-emerald-500/30 text-emerald-400 text-sm font-bold flex gap-2">
                  <CheckCircle2 size={16} /> {formData.firstStock.name} - {formData.firstStock.qty} {formData.firstStock.unit}
                </div>
              )}
              <Button 
                disabled={!formData.firstStock}
                onClick={() => setStep(4)}
                className="w-full h-16 rounded-2xl bg-white/10 text-white font-black"
              >
                {texts.next}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">{texts.step4Title}</h1>
              <p className="text-white/60 font-medium">{texts.step4Sub}</p>
            </div>
            <div className="flex flex-col items-center space-y-8">
              <button 
                onClick={startListening}
                disabled={isProcessing}
                className={cn(
                  "h-32 w-32 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90",
                  isListening ? "bg-red-500 animate-pulse" : "bg-[#C45000]",
                  formData.firstSale && "bg-emerald-500"
                )}
              >
                {isProcessing ? <Loader2 className="text-white animate-spin" size={48} /> : 
                 formData.firstSale ? <CheckCircle2 className="text-white" size={48} /> : <Mic className="text-white" size={48} />}
              </button>
              <p className="text-white/40 text-sm italic">{texts.step4Instr}</p>
              {formData.firstSale && (
                <div className="bg-white/5 p-4 rounded-2xl border border-emerald-500/30 text-emerald-400 text-sm font-bold flex gap-2">
                  <CheckCircle2 size={16} /> {formData.firstSale.productName} - ₹{formData.firstSale.price}
                </div>
              )}
              <Button 
                disabled={!formData.firstSale}
                onClick={() => setStep(5)}
                className="w-full h-16 rounded-2xl bg-white/10 text-white font-black"
              >
                {texts.next}
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-in zoom-in-95 text-center">
            <div className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl">
              <CheckCircle2 size={64} />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">{texts.congrats}</h1>
              <p className="text-white/60 font-medium">{texts.congratsSub}</p>
            </div>
            <Button 
              onClick={finishSetup}
              className="w-full h-20 rounded-[32px] bg-[#C45000] text-white font-black text-xl shadow-2xl"
            >
              {texts.finish}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
