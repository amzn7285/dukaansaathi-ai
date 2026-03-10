"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store, Phone, CheckCircle2, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";

interface FirstLaunchFlowProps {
  onComplete: () => void;
  language: "hi-IN" | "en-IN";
}

const BUSINESS_TYPES = [
  { id: 'kirana', emoji: '🏪', en: "Kirana Store", hi: "किराना स्टोर" },
  { id: 'dhaba', emoji: '🍵', en: "Dhaba", hi: "ढाबा" },
  { id: 'tailor', emoji: '✂️', en: "Tailor", hi: "दर्जी" },
  { id: 'repair', emoji: '🔧', en: "Repair Shop", hi: "रिपेयर शॉप" },
  { id: 'milk', emoji: '🥛', en: "Milk Delivery", hi: "दूध की डिलीवरी" },
  { id: 'medical', emoji: '💊', en: "Medical Store", hi: "मेडिकल स्टोर" },
  { id: 'salon', emoji: '💇', en: "Salon", hi: "सैलून" },
  { id: 'other', emoji: '📦', en: "Other Business", hi: "अन्य व्यापार" },
];

export default function FirstLaunchFlow({ onComplete, language }: FirstLaunchFlowProps) {
  const [shopName, setShopName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [businessType, setBusinessType] = useState("kirana");
  const [isFinished, setIsFinished] = useState(false);

  const isHi = language === 'hi-IN';

  const finishSetup = () => {
    const profile = {
      shopName,
      ownerPhone,
      businessType: businessType || 'kirana',
      ownerName: "Owner",
    };
    localStorage.setItem("bolvyaapar_profile", JSON.stringify(profile));
    setIsFinished(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const texts = {
    "hi-IN": {
      title: "दुकान की जानकारी",
      sub: "अपना डिजिटल सफर शुरू करें",
      shopName: "दुकान का नाम *",
      shopPlaceholder: "जैसे: राहुल जनरल स्टोर",
      phone: "WhatsApp नंबर (वैकल्पिक)",
      biz: "व्यापार का प्रकार",
      start: "शुरू करें 🚀",
      done: "सेटअप पूरा हो गया!"
    },
    "en-IN": {
      title: "Shop Details",
      sub: "Start your digital journey",
      shopName: "Shop Name *",
      shopPlaceholder: "e.g. Rahul General Store",
      phone: "WhatsApp Number (Optional)",
      biz: "Business Type",
      start: "Get Started 🚀",
      done: "Setup Complete!"
    }
  }[language];

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-[#0D2240] z-[150] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="h-32 w-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl animate-bounce mb-8">
          <CheckCircle2 size={64} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">{texts.done}</h1>
        <p className="text-[#FFB300] font-black text-xl uppercase tracking-widest">{shopName}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0D2240] z-[100] flex flex-col p-6 overflow-y-auto">
      <div className="max-w-md mx-auto w-full space-y-8 py-12">
        
        <div className="text-center space-y-2 mb-4">
          <div className="flex items-center justify-center gap-1 mb-4">
            <span className="text-[#38BDF8] font-black text-2xl uppercase tracking-tighter">BolVyaapar</span>
            <span className="text-[#FFB300] font-black text-2xl">AI</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">{texts.title}</h1>
          <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.2em]">{texts.sub}</p>
        </div>

        <Card className="bg-white/5 border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2">
                  <Store size={14} /> {texts.shopName}
                </Label>
                <Input
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder={texts.shopPlaceholder}
                  className="h-16 rounded-2xl bg-white/5 border-white/10 text-white text-lg placeholder:text-white/20 focus:ring-[#38BDF8]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2">
                  <Phone size={14} /> {texts.phone}
                </Label>
                <Input
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  placeholder="91XXXXXXXXXX"
                  type="tel"
                  className="h-16 rounded-2xl bg-white/5 border-white/10 text-white text-lg placeholder:text-white/20 focus:ring-[#38BDF8]"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2">
                  <ShoppingBasket size={14} /> {texts.biz}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setBusinessType(type.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-[24px] border transition-all active:scale-95",
                        businessType === type.id 
                          ? "bg-[#38BDF8]/20 border-[#38BDF8] ring-1 ring-[#38BDF8]" 
                          : "bg-white/5 border-white/10 text-white/40"
                      )}
                    >
                      <span className="text-3xl mb-1">{type.emoji}</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest text-center leading-tight",
                        businessType === type.id ? "text-white" : "text-white/40"
                      )}>
                        {isHi ? type.hi : type.en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              disabled={!shopName.trim()}
              onClick={finishSetup}
              className="w-full h-20 rounded-[32px] bg-[#C45000] text-white font-black text-xl shadow-2xl active:scale-95 disabled:opacity-30 transition-all"
            >
              {texts.start}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}