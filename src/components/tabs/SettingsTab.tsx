"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, User, Phone, ShoppingBasket, Volume2 } from "lucide-react";

interface SettingsTabProps {
  language: "hi-IN" | "en-IN";
  profile: any;
  onUpdateProfile: (profile: any) => void;
}

const BUSINESS_TYPES = [
  { id: 'kirana', emoji: '🏪', en: "Kirana Store", hi: "किराना स्टोर" },
  { id: 'dhaba', emoji: '🍵', en: "Dhaba", hi: "ढाबा" },
  { id: 'tailor', emoji: '✂️', en: "Tailor", hi: "दर्जी" },
  { id: 'repair', emoji: '🔧', en: "Repair Shop", hi: "रिपेयर शॉप" },
  { id: 'milk', emoji: '🥛', en: "Milk Delivery", hi: "दूध की डिलीवरी" },
  { id: 'medical', emoji: '💊', en: "Medical Store", hi: "मेडिकल स्टोर" },
  { id: 'salon', emoji: '💇', en: "Salon", hi: "सैलून" },
  { id: 'other', emoji: '📦', en: "Other Biz", hi: "अन्य व्यापार" },
];

export default function SettingsTab({ language, profile, onUpdateProfile }: SettingsTabProps) {
  const [formData, setFormData] = useState(profile || { 
    shopName: "", 
    businessType: "kirana", 
    ownerName: "", 
    ownerPhone: "", 
    supplierPhone: "" 
  });
  const { toast } = useToast();

  const handleHelp = () => {
    const text = language === 'hi-IN' 
      ? "नमस्ते। सेल लिखने के लिए माइक बटन दबाकर बोलें। स्टॉक चेक करने के लिए स्टॉक टैब पर जाएँ। उधार देखने के लिए खाता टैब इस्तेमाल करें और रिपोर्ट टैब में आज का मुनाफा देखें।"
      : "Hello. To record a sale, press the mic and speak. Check inventory in the Stock tab. Manage credit in the Khata tab and see your net profit in the Report tab.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    localStorage.setItem("bolvyaapar_profile", JSON.stringify(formData));
    toast({ title: language === 'hi-IN' ? "अपडेट हो गया!" : "Profile Updated!" });
  };

  const texts = {
    "hi-IN": { title: "सेटिंग्स", help: "मदद सुनें", save: "अपडेट करें", shop: "दुकान का नाम", owner: "मालिक का नाम", ownerWA: "मालिक WhatsApp", supplierWA: "सप्लायर WhatsApp", biz: "व्यापार" },
    "en-IN": { title: "Settings", help: "Listen to Help", save: "Update Profile", shop: "Shop Name", owner: "Owner Name", ownerWA: "Owner WhatsApp", supplierWA: "Supplier WhatsApp", biz: "Business" }
  }[language];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-slate-900">{texts.title}</h2>
        <button onClick={handleHelp} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 h-12 rounded-2xl font-black uppercase text-xs border border-blue-100 shadow-sm">
          <Volume2 size={18} /> {texts.help}
        </button>
      </div>

      <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Store size={14} /> {texts.shop}</Label>
                <Input required className="bg-slate-50 h-14 rounded-2xl text-lg font-bold" value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><ShoppingBasket size={14} /> {texts.biz}</Label>
                <Select value={formData.businessType} onValueChange={(val) => setFormData({...formData, businessType: val})}>
                  <SelectTrigger className="bg-slate-50 h-14 rounded-2xl text-lg font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2"><span>{type.emoji}</span><span>{language === 'hi-IN' ? type.hi : type.en}</span></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><User size={14} /> {texts.owner}</Label>
                <Input required className="bg-slate-50 h-14 rounded-2xl font-bold" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Phone size={14} /> {texts.ownerWA}</Label>
                  <Input required className="bg-slate-50 h-14 rounded-2xl font-bold" placeholder="91..." value={formData.ownerPhone} onChange={e => setFormData({...formData, ownerPhone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Phone size={14} /> {texts.supplierWA}</Label>
                  <Input className="bg-slate-50 h-14 rounded-2xl font-bold" placeholder="91..." value={formData.supplierPhone} onChange={e => setFormData({...formData, supplierPhone: e.target.value})} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-16 rounded-3xl bg-[#C45000] text-white font-black text-lg shadow-xl shadow-[#C45000]/20 active:scale-95 transition-all">
              {texts.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}