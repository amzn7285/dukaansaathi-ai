
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, User, Phone, Users, ShieldCheck, ShoppingBasket, Scissors, Wrench, Utensils, Truck, Pill, ScissorsLineDashed, Box } from "lucide-react";

interface SettingsTabProps {
  language: "hi-IN" | "en-IN";
  profile: any;
  onUpdateProfile: (profile: any) => void;
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

export default function SettingsTab({ language, profile, onUpdateProfile }: SettingsTabProps) {
  const [formData, setFormData] = useState(profile || {
    shopName: "",
    businessType: "kirana",
    ownerName: "",
    ownerPhone: "",
    supplierName: "",
    supplierPhone: "",
    helperName: "",
    familyPhone: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    localStorage.setItem("bolvyapar_profile", JSON.stringify(formData));
    toast({ title: language === 'hi-IN' ? "प्रोफ़ाइल अपडेट हो गई!" : "Profile Updated!" });
  };

  const texts = {
    "hi-IN": {
      title: "सेटिंग्स",
      subtitle: "व्यापार की जानकारी बदलें",
      shop: "दुकान का नाम",
      bizType: "व्यापार का प्रकार",
      owner: "मालिक का नाम",
      ownerPhone: "मालिक का WhatsApp",
      supplier: "सप्लायर का नाम",
      supplierPhone: "सप्लायर WhatsApp",
      helper: "हेल्पर का नाम",
      family: "परिवार का WhatsApp",
      save: "अपडेट करें"
    },
    "en-IN": {
      title: "Settings",
      subtitle: "Update business profile",
      shop: "Shop Name",
      bizType: "Business Type",
      owner: "Owner Name",
      ownerPhone: "Owner WhatsApp",
      supplier: "Supplier Name",
      supplierPhone: "Supplier WhatsApp",
      helper: "Helper Name",
      family: "Family WhatsApp",
      save: "Update Profile"
    }
  }[language];

  return (
    <div className="space-y-6">
      <div className="px-1">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">{texts.title}</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{texts.subtitle}</p>
      </div>

      <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Store size={12} /> {texts.shop}
                </Label>
                <Input 
                  required 
                  className="bg-slate-50 border-slate-100 h-12 rounded-xl" 
                  value={formData.shopName}
                  onChange={e => setFormData({...formData, shopName: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <ShoppingBasket size={12} /> {texts.bizType}
                </Label>
                <Select 
                  value={formData.businessType} 
                  onValueChange={(val) => setFormData({...formData, businessType: val})}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-100 h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <span>{type.emoji}</span>
                          <span>{language === 'hi-IN' ? type.hi : type.en}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <User size={12} /> {texts.owner}
                  </Label>
                  <Input 
                    required 
                    className="bg-slate-50 border-slate-100 h-12 rounded-xl" 
                    value={formData.ownerName}
                    onChange={e => setFormData({...formData, ownerName: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Phone size={12} /> WhatsApp
                  </Label>
                  <Input 
                    required 
                    className="bg-slate-50 border-slate-100 h-12 rounded-xl" 
                    value={formData.ownerPhone}
                    onChange={e => setFormData({...formData, ownerPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Users size={12} /> {texts.supplier}
                  </Label>
                  <Input 
                    className="bg-slate-50 border-slate-100 h-12 rounded-xl" 
                    value={formData.supplierName}
                    onChange={e => setFormData({...formData, supplierName: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Phone size={12} /> Supplier WA
                  </Label>
                  <Input 
                    className="bg-slate-50 border-slate-100 h-12 rounded-xl" 
                    value={formData.supplierPhone}
                    onChange={e => setFormData({...formData, supplierPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <ShieldCheck size={12} /> {texts.helper}
                </Label>
                <Input 
                  className="bg-slate-50 border-slate-100 h-12 rounded-xl" 
                  value={formData.helperName}
                  onChange={e => setFormData({...formData, helperName: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Phone size={12} /> {texts.family}
                </Label>
                <Input 
                  className="bg-slate-50 border-slate-100 h-12 rounded-xl" 
                  value={formData.familyPhone}
                  onChange={e => setFormData({...formData, familyPhone: e.target.value})}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-[#C45000] text-white font-black shadow-lg shadow-[#C45000]/20 active:scale-95 transition-all">
              {texts.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
