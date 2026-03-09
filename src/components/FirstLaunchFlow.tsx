"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store, Mic, Loader2, CheckCircle2, X, AlertCircle, ShoppingBag, Package } from "lucide-react";
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
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [formData, setFormData] = useState({
    shopName: "",
    ownerPhone: "",
    businessType: "",
    firstStock: null as any,
    firstSale: null as any
  });

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef(""); 

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.interimResults = true;
        
        recognition.onstart = () => {
          setIsListening(true);
          setMicError(false);
          setTranscript("");
          transcriptRef.current = "";
        };

        recognition.onresult = (e: any) => {
          const current = e.results[0][0].transcript;
          setTranscript(current);
          transcriptRef.current = current;
        };

        recognition.onend = () => {
          setIsListening(false);
          if (transcriptRef.current) {
            handleVoiceAction(transcriptRef.current);
          }
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setMicError(true);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setMicError(true);
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
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    setTranscript("");
    transcriptRef.current = "";
    try {
      recognitionRef.current?.start();
    } catch (e) {
      setMicError(true);
    }
  };

  const handleVoiceAction = async (query: string) => {
    if (!query.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      let systemPrompt = "";
      if (step === 3) {
        systemPrompt = `Extract stock details from voice. Context: ${formData.businessType}. Return ONLY JSON: {"name": "item name", "qty": number, "unit": "kg/L/pieces/etc", "emoji": "emoji", "price": number}`;
      } else if (step === 4) {
        systemPrompt = `Extract sale details from voice. Return ONLY JSON: {"productName": "item", "price": number, "quantity": number}`;
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
          setFormData(prev => ({ ...prev, firstStock: parsed }));
          speak(language === 'hi-IN' ? "स्टॉक जोड़ दिया गया है" : "Stock added");
        } else if (step === 4) {
          setFormData(prev => ({ ...prev, firstSale: parsed }));
          speak(language === 'hi-IN' ? "बिक्री दर्ज हो गई" : "Sale recorded");
        }
        setManualInput("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
      setTranscript("");
      transcriptRef.current = "";
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(prev => prev + 1);
    } else {
      finishSetup();
    }
  };

  const finishSetup = () => {
    const finalProfile = {
      ...formData,
      ownerName: "Owner",
      businessType: formData.businessType || 'kirana'
    };
    localStorage.setItem("bolvyaapar_profile", JSON.stringify(finalProfile));
    
    if (formData.firstStock) {
      const stockItem = {
        ...formData.firstStock,
        id: Date.now(),
        level: 100,
        maxQty: formData.firstStock.qty,
        lowStockLevel: Math.max(1, Math.floor(formData.firstStock.qty * 0.1)),
        price: formData.firstStock.price || 0
      };
      localStorage.setItem("bolvyaapar_stock_data", JSON.stringify([stockItem]));
    }

    if (formData.firstSale) {
      const saleItem = {
        ...formData.firstSale,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        customer: language === 'hi-IN' ? "ग्राहक" : "Customer",
        item: formData.firstSale.productName,
        amount: formData.firstSale.price,
        qty: `${formData.firstSale.quantity || 1} units`
      };
      localStorage.setItem("bolvyaapar_sales_history", JSON.stringify([saleItem]));
    }

    onComplete();
  };

  const getStep3Strings = () => {
    const biz = formData.businessType;
    const isHi = language === 'hi-IN';
    const config: Record<string, any> = {
      tailor: { title: isHi ? "कपड़ा और सामान" : "Add Fabric/Materials", sub: isHi ? "पहला थान या रील बोलकर जोड़ें" : "Add first material by voice", instr: isHi ? "जैसे: '50 मीटर सूती कपड़ा है'" : "e.g. 'I have 50 meters cotton fabric'" },
      repair: { title: isHi ? "पार्ट्स इन्वेंट्री" : "Add Parts Inventory", sub: isHi ? "पहला पुर्जा बोलकर जोड़ें" : "Add first part by voice", instr: isHi ? "जैसे: '20 मोबाइल स्क्रीन हैं'" : "e.g. 'I have 20 mobile screens'" },
      dhaba: { title: isHi ? "सामग्री जोड़ें" : "Add Ingredients", sub: isHi ? "पहली सामग्री बोलकर जोड़ें" : "Add first ingredient by voice", instr: isHi ? "जैसे: '10 किलो आटा है'" : "e.g. '10kg Atta hai'" },
      milk: { title: isHi ? "उत्पाद जोड़ें" : "Add Products", sub: isHi ? "दूध की मात्रा बोलकर जोड़ें" : "Add milk quantity by voice", instr: isHi ? "जैसे: '50 लीटर दूध रोज़ आता है'" : "e.g. '50 Litres doodh hai'" },
      medical: { title: isHi ? "दवाइयां जोड़ें" : "Add Medicines", sub: isHi ? "पहली दवा बोलकर जोड़ें" : "Add first medicine by voice", instr: isHi ? "जैसे: '100 पैरासिटामोल टैबलेट हैं'" : "e.g. 'I have 100 Paracetamol tablets'" },
      salon: { title: isHi ? "ब्यूटी प्रोडक्ट्स" : "Add Products", sub: isHi ? "पहला सामान बोलकर जोड़ें" : "Add first product by voice", instr: isHi ? "जैसे: '5 बोतल शैम्पू है'" : "e.g. '5 bottles shampoo hai'" },
      kirana: { title: isHi ? "स्टॉक जोड़ें" : "Add Stock", sub: isHi ? "पहला सामान बोलकर जोड़ें" : "Add your first item by voice", instr: isHi ? "जैसे: '10 किलो चावल है'" : "e.g. 'I have 10kg Rice'" },
      other: { title: isHi ? "स्टॉक जोड़ें" : "Add Stock", sub: isHi ? "पहला सामान बोलकर जोड़ें" : "Add your first item by voice", instr: isHi ? "जैसे: '100 पीस माल है'" : "e.g. '100 units stock hai'" }
    };
    return config[biz] || config['kirana'];
  };

  const texts = {
    "hi-IN": {
      step1Title: "दुकान की जानकारी", step1Sub: "अपने व्यापार की शुरुआत करें",
      shopName: "दुकान का नाम", ownerPhone: "आपका WhatsApp नंबर",
      step2Title: "व्यापार का प्रकार", step2Sub: "एक विकल्प चुनें",
      step4Title: "पहली बिक्री", step4Sub: "बोलकर पहली बिक्री दर्ज करें",
      step4Instr: "जैसे: '2 किलो चावल बेचा 100 रुपये में'",
      next: "अगला", finish: "शुरू करें", congrats: "बधाई हो!", congratsSub: "आपका सेटअप पूरा हो गया है",
      typeHere: "यहाँ लिखें (वैकल्पिक)", save: "सहेजें",
      saved: "सुरक्षित किया गया"
    },
    "en-IN": {
      step1Title: "Shop Details", step1Sub: "Let's start your digital journey",
      shopName: "Shop Name", ownerPhone: "Your WhatsApp Number",
      step2Title: "Business Type", step2Sub: "Select your category",
      step4Title: "First Sale", step4Sub: "Record your first sale by voice",
      step4Instr: "e.g. 'Sold 2kg Rice for 100 rupees'",
      next: "Next", finish: "Get Started", congrats: "Congratulations!", congratsSub: "Your setup is complete",
      typeHere: "Type here (Optional)", save: "Save",
      saved: "Saved"
    }
  }[language];

  const currentSavedItem = step === 3 ? formData.firstStock : formData.firstSale;

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
                  <Input value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} placeholder="e.g. Rahul General Store" className="h-16 rounded-2xl bg-white/5 border-white/10 text-white text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest">{texts.ownerPhone}</Label>
                  <Input value={formData.ownerPhone} onChange={e => setFormData({...formData, ownerPhone: e.target.value})} placeholder="91..." className="h-16 rounded-2xl bg-white/5 border-white/10 text-white text-lg" />
                </div>
                <Button disabled={!formData.shopName || !formData.ownerPhone} onClick={() => setStep(2)} className="w-full h-16 rounded-2xl bg-[#C45000] text-white font-black text-lg">{texts.next}</Button>
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
                  onClick={() => { setFormData({...formData, businessType: type.id}); setStep(3); }} 
                  className={cn("flex flex-col items-center justify-center p-6 rounded-[32px] border transition-all active:scale-95", formData.businessType === type.id ? "bg-[#38BDF8] border-[#38BDF8]" : "bg-white/5 border-white/10")}
                >
                  <span className="text-4xl mb-3">{type.emoji}</span>
                  <span className="text-[11px] font-black text-white uppercase text-center leading-tight">{language === 'hi-IN' ? type.hi : type.en}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(step === 3 || step === 4) && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">{step === 3 ? getStep3Strings().title : texts.step4Title}</h1>
              <p className="text-white/60 font-medium">{step === 3 ? getStep3Strings().sub : texts.step4Sub}</p>
            </div>
            
            <div className="flex flex-col items-center space-y-8">
              <div className="relative">
                <button 
                  onClick={startListening} 
                  disabled={isProcessing} 
                  className={cn(
                    "h-32 w-32 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90", 
                    isListening ? "bg-red-500 animate-pulse" : "bg-[#C45000]",
                    currentSavedItem && "ring-4 ring-emerald-500"
                  )}
                >
                  {isProcessing ? <Loader2 className="text-white animate-spin" size={48} /> : 
                   currentSavedItem ? <CheckCircle2 className="text-white" size={48} /> : <Mic className="text-white" size={48} />}
                </button>
                {isListening && (
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-64 text-center">
                    <p className="text-[#38BDF8] font-black text-sm animate-pulse">"{transcript || "..."}"</p>
                  </div>
                )}
              </div>

              <p className="text-white/40 text-sm italic text-center px-4">{step === 3 ? getStep3Strings().instr : texts.step4Instr}</p>

              <div className="w-full space-y-4">
                <div className="relative">
                  <Input 
                    value={manualInput} 
                    onChange={e => setManualInput(e.target.value)} 
                    placeholder={texts.typeHere} 
                    className="h-16 rounded-2xl bg-white/5 border-white/10 text-white pr-24" 
                  />
                  <Button 
                    onClick={() => handleVoiceAction(manualInput)} 
                    disabled={!manualInput.trim() || isProcessing} 
                    className="absolute right-2 top-2 h-12 bg-[#38BDF8] text-[#0D2240] font-black px-4 rounded-xl"
                  >
                    {texts.save}
                  </Button>
                </div>
                {micError && (
                  <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase justify-center">
                    <AlertCircle size={14} /> Mic permission needed or not supported
                  </div>
                )}
              </div>

              {currentSavedItem && (
                <div className="w-full bg-white/5 border border-emerald-500/30 p-6 rounded-[32px] flex items-center justify-between animate-in zoom-in-95">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-3xl">
                      {step === 3 ? (currentSavedItem.emoji || <Package className="text-emerald-400" />) : <ShoppingBag className="text-emerald-400" />}
                    </div>
                    <div>
                      <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={12} /> {texts.saved}
                      </p>
                      <h4 className="text-xl font-black text-white">
                        {step === 3 ? currentSavedItem.name : currentSavedItem.productName}
                      </h4>
                      <p className="text-white/40 text-sm font-bold">
                        {step === 3 
                          ? `${currentSavedItem.qty} ${currentSavedItem.unit} ${currentSavedItem.price ? '• ₹' + currentSavedItem.price : ''}`
                          : `₹${currentSavedItem.price} • ${currentSavedItem.quantity || 1} units`}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="text-emerald-500" size={32} />
                </div>
              )}

              <Button 
                onClick={handleNext} 
                className="w-full h-16 rounded-2xl bg-[#38BDF8] text-[#0D2240] font-black text-lg shadow-xl shadow-[#38BDF8]/20"
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
            <Button onClick={finishSetup} className="w-full h-20 rounded-[32px] bg-[#C45000] text-white font-black text-xl shadow-2xl">{texts.finish}</Button>
          </div>
        )}

      </div>
    </div>
  );
}
