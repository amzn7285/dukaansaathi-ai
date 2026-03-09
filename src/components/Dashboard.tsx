
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Home, Package, BarChart3, Lock, BookOpen, Eye, EyeOff, UserSquare2, MessageCircle, X, Sparkles, Share2 } from "lucide-react";
import DukaanTab from "./tabs/DukaanTab";
import StockTab from "./tabs/StockTab";
import ReportTab from "./tabs/ReportTab";
import SettingsTab from "./tabs/SettingsTab";
import CreditKhataTab from "./tabs/CreditKhataTab";
import VoiceButton from "./VoiceButton";
import CustomerView from "./CustomerView";
import ConnectivityBanner from "./ConnectivityBanner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DashboardProps {
  role: "owner" | "helper";
  language: "hi-IN" | "en-IN";
  onLogout: () => void;
}

const SALES_STORAGE_KEY = "bolvyapar_sales_history";
const EXPENSES_STORAGE_KEY = "bolvyapar_expenses_history";
const STOCK_STORAGE_KEY = "bolvyapar_stock_data";
const CREDIT_KHATA_KEY = "bolvyapar_credit_khata";
const PROFILE_KEY = "bolvyapar_profile";

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

export default function Dashboard({ role, language, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dukaan");
  const [privateMode, setPrivateMode] = useState(false);
  const [isCustomerView, setIsCustomerView] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [creditKhata, setCreditKhata] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryModal, setSummaryModal] = useState<{ show: boolean, text: string, whatsappUrl: string } | null>(null);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  useEffect(() => {
    const savedSales = localStorage.getItem(SALES_STORAGE_KEY);
    if (savedSales) {
      try { setSales(JSON.parse(savedSales)); } catch (e) { console.error(e); }
    }

    const savedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (savedExpenses) {
      try { setExpenses(JSON.parse(savedExpenses)); } catch (e) { console.error(e); }
    }

    const savedStock = localStorage.getItem(STOCK_STORAGE_KEY);
    if (savedStock) {
      try { setStock(JSON.parse(savedStock)); } catch (e) { console.error(e); }
    }

    const savedKhata = localStorage.getItem(CREDIT_KHATA_KEY);
    if (savedKhata) {
      try { setCreditKhata(JSON.parse(savedKhata)); } catch (e) { console.error(e); }
    }

    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (savedProfile) {
      try { setProfile(JSON.parse(savedProfile)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleTransaction = (details: any) => {
    const timestamp = new Date().toISOString();
    setLastTransaction({ ...details, timestamp });
    
    if (details.isNewCustomer) {
      const newEntry = {
        id: Date.now(),
        name: details.customerName,
        phone: details.customerPhone || "",
        balance: 0,
        history: [],
        lastPaymentAt: null
      };
      const updated = [...creditKhata, newEntry];
      setCreditKhata(updated);
      localStorage.setItem(CREDIT_KHATA_KEY, JSON.stringify(updated));
      return;
    }

    if (details.isExpense) {
      const newExpense = {
        id: Date.now(),
        timestamp,
        category: details.productName || (language === 'hi-IN' ? 'खर्चा' : 'Expense'),
        amount: details.price || 0
      };
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
      return;
    }

    if (details.isCredit) {
      const updatedKhata = creditKhata.map(c => {
        if (c.name.toLowerCase() === details.customerName?.toLowerCase()) {
          const entry = { 
            id: Date.now(), 
            timestamp, 
            type: 'credit', 
            amount: details.price || 0, 
            note: details.productName || (language === 'hi-IN' ? 'उधार' : 'Credit') 
          };
          return { ...c, balance: (c.balance || 0) + (details.price || 0), history: [entry, ...(c.history || [])] };
        }
        return c;
      });
      setCreditKhata(updatedKhata);
      localStorage.setItem(CREDIT_KHATA_KEY, JSON.stringify(updatedKhata));
    }

    if (details.isPayment) {
      const updatedKhata = creditKhata.map(c => {
        if (c.name.toLowerCase() === details.customerName?.toLowerCase()) {
          const entry = { 
            id: Date.now(), 
            timestamp, 
            type: 'payment', 
            amount: details.price || 0, 
            note: language === 'hi-IN' ? 'जमा' : 'Received payment' 
          };
          return { 
            ...c, 
            balance: Math.max(0, (c.balance || 0) - (details.price || 0)), 
            history: [entry, ...(c.history || [])],
            lastPaymentAt: timestamp
          };
        }
        return c;
      });
      setCreditKhata(updatedKhata);
      localStorage.setItem(CREDIT_KHATA_KEY, JSON.stringify(updatedKhata));
      return;
    }

    const newSale = {
      id: Date.now(),
      timestamp,
      item: details.productName || "Unknown Item",
      qty: details.quantity ? `${details.quantity} ${details.unit || ''}` : "---",
      customer: details.customerName || (language === 'hi-IN' ? 'ग्राहक' : 'Customer'),
      amount: details.price || 0,
      metadata: details.metadata
    };

    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updatedSales));

    const soldQty = Number(details.quantity) || 0;
    const prodName = (details.productName || "").toLowerCase();
    const updatedStock = stock.map(item => {
      let isMatch = false;
      const itemName = item.name.toLowerCase();
      const itemHiName = (item.hiName || "").toLowerCase();
      if (prodName.includes(itemName) || prodName.includes(itemHiName) || details.matchedCategory === item.name) {
        isMatch = true;
      }
      if (isMatch) {
        const newQty = Math.max(0, item.qty - soldQty);
        const maxQty = item.maxQty || 100;
        const newLevel = (newQty / maxQty) * 100;
        return { ...item, qty: newQty, level: newLevel };
      }
      return item;
    });
    setStock(updatedStock);
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(updatedStock));
  };

  const handleDailySummary = async () => {
    if (isGeneratingSummary) return;
    setIsGeneratingSummary(true);

    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
    const todayExpenses = expenses.filter(e => new Date(e.timestamp).toDateString() === today);
    
    const salesCount = todaySales.length;
    
    const itemMap: Record<string, number> = {};
    todaySales.forEach(s => {
      const qty = parseFloat(s.qty) || 1;
      itemMap[s.item] = (itemMap[s.item] || 0) + qty;
    });
    const bestSellingItem = Object.entries(itemMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "---";

    let creditCount = 0;
    creditKhata.forEach(c => {
      const todayHistory = c.history?.filter((h: any) => h.type === 'credit' && new Date(h.timestamp).toDateString() === today);
      creditCount += (todayHistory?.length || 0);
    });

    const expenseCount = todayExpenses.length;

    const criticalStock = [...stock].sort((a, b) => a.level - b.level)[0];
    const stockTip = criticalStock ? 
      (language === 'hi-IN' ? `${criticalStock.hiName || criticalStock.name} खत्म होने वाला है, नया ऑर्डर दें।` : `${criticalStock.name} is low, order soon.`) : 
      (language === 'hi-IN' ? "सब स्टॉक ठीक है।" : "Stock levels are healthy.");

    const bizTerms: Record<string, { hi: string, en: string }> = {
      dhaba: { hi: "खाना खिलाया", en: "dishes served" },
      tailor: { hi: "ऑर्डर पूरे किए", en: "orders completed" },
      repair: { hi: "रिपेयर किए", en: "jobs finished" },
      milk: { hi: "डिलीवरी की", en: "deliveries done" },
      kirana: { hi: "सामान बेचा", en: "items sold" },
      medical: { hi: "दवाई बेची", en: "medicines sold" },
      salon: { hi: "सर्विस दी", en: "services provided" },
      other: { hi: "काम किया", en: "tasks completed" }
    };
    const term = bizTerms[profile?.businessType || 'other']?.[language] || bizTerms['other'][language];

    const systemPrompt = `You are BolVyapar AI. Generate a 30-second spoken summary of today's business. 
    Terminology to use: ${term}.
    Data:
    - ${salesCount} ${term}
    - Top Item: ${bestSellingItem}
    - ${creditCount} Credits Issued
    - ${expenseCount} Expenses Logged
    - Action Tip: ${stockTip}
    
    Language: ${language === 'hi-IN' ? 'Hindi' : 'English'}. NEVER mention net profit or exact money totals. Focus on counts and products. Keep it under 30 seconds.`;

    try {
      if (!navigator.onLine) {
        throw new Error("Offline");
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: "Give me my daily summary", systemPrompt }),
      });
      const data = await response.json();
      const text = data.reply || "";
      
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        window.speechSynthesis.speak(utterance);
      }

      const shareMsg = language === 'hi-IN' 
        ? `📊 *आज का हिसाब: ${profile?.shopName || 'BolVyapar Shop'}*\n\n✅ ${salesCount} ${term}\n🔥 खास: ${bestSellingItem}\n💸 ${creditCount} बार उधार दिया\n📉 ${expenseCount} खर्चे लिखे\n💡 टिप: ${stockTip}\n\n_BolVyapar AI द्वारा_`
        : `📊 *Today's Summary: ${profile?.shopName || 'BolVyapar Shop'}*\n\n✅ ${salesCount} ${term}\n🔥 Best Seller: ${bestSellingItem}\n💸 ${creditCount} Credits Given\n📉 ${expenseCount} Expenses Logged\n💡 Tip: ${stockTip}\n\n_Generated by BolVyapar AI_`;
      
      const whatsappUrl = `https://wa.me/${profile?.ownerPhone}?text=${encodeURIComponent(shareMsg)}`;
      
      setSummaryModal({ show: true, text, whatsappUrl });
    } catch (err) {
      console.error(err);
      // Show offline fallback if summary fails
      const shareMsg = language === 'hi-IN' 
        ? `📊 *आज का हिसाब (ऑफलाइन)*\n✅ ${salesCount} ${term}\n_BolVyapar AI_`
        : `📊 *Daily Summary (Offline)*\n✅ ${salesCount} ${term}\n_BolVyapar AI_`;
      setSummaryModal({ 
        show: true, 
        text: language === 'hi-IN' ? "ऑफलाइन: रिपोर्ट तैयार है।" : "Offline: Report is ready.", 
        whatsappUrl: `https://wa.me/${profile?.ownerPhone}?text=${encodeURIComponent(shareMsg)}` 
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const totalOutstanding = creditKhata.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const redItemsCount = stock.filter(item => item.level < 15).length;
  const bizInfo = BUSINESS_TYPES.find(b => b.id === profile?.businessType) || BUSINESS_TYPES[0];

  const texts = {
    "hi-IN": { dukaan: "दुकान", stock: "स्टॉक", khata: "खाता", report: "रिपोर्ट", customer: "ग्राहक व्यू", share: "WhatsApp पर शेयर करें" },
    "en-IN": { dukaan: "Home", stock: "Stock", khata: "Khata", report: "Report", customer: "Customer View", share: "Share on WhatsApp" }
  }[language];

  if (isCustomerView) {
    return <CustomerView transaction={lastTransaction} onBack={() => setIsCustomerView(false)} language={language} />;
  }

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      <ConnectivityBanner language={language} />
      
      <header className="bg-[#0D2240] px-6 py-4 flex items-center justify-between shadow-2xl z-20 shrink-0 border-b border-white/5">
        <div className="flex flex-col">
          <div className="text-xl font-black flex items-baseline">
            <span className="text-[#C45000]">Bol</span>
            <span className="text-[#1A6B3C]">Vyapar</span>
            <span className="text-[#FFB300] ml-1 text-[10px] font-bold">AI 🇮🇳</span>
          </div>
          <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
            {bizInfo.emoji} {language === 'hi-IN' ? bizInfo.hi : bizInfo.en}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setPrivateMode(!privateMode)}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
              privateMode ? 'bg-[#C45000] text-white' : 'bg-white/5 text-white/40'
            )}
          >
            {privateMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button onClick={onLogout} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40">
            <Lock size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-48 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsContent value="dukaan" className="m-0 p-4">
            <DukaanTab 
              privateMode={privateMode} 
              language={language} 
              sales={sales} 
              expenses={expenses}
              profile={profile}
              totalOutstanding={totalOutstanding}
              onGenerateSummary={handleDailySummary}
              isGeneratingSummary={isGeneratingSummary}
            />
          </TabsContent>
          <TabsContent value="stock" className="m-0 p-4">
            <StockTab language={language} stock={stock} onAddCategory={(cat) => setStock([...stock, cat])} sales={sales} profile={profile} />
          </TabsContent>
          <TabsContent value="khata" className="m-0 p-4">
            <CreditKhataTab language={language} customers={creditKhata} onUpdateCustomers={(k) => { setCreditKhata(k); localStorage.setItem(CREDIT_KHATA_KEY, JSON.stringify(k)); }} profile={profile} sales={sales} />
          </TabsContent>
          <TabsContent value="report" className="m-0 p-4">
            <ReportTab role={role} privateMode={privateMode} language={language} sales={sales} expenses={expenses} profile={profile} />
          </TabsContent>
          <TabsContent value="settings" className="m-0 p-4">
            <SettingsTab language={language} profile={profile} onUpdateProfile={(p) => setProfile(p)} />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!summaryModal} onOpenChange={() => setSummaryModal(null)}>
        <DialogContent className="max-w-[90vw] rounded-[40px] p-0 border-none bg-white overflow-hidden shadow-2xl">
          <div className="bg-[#0D2240] p-8 text-white relative overflow-hidden">
            <Sparkles size={80} className="absolute right-[-10px] top-[-10px] text-white/5" />
            <button onClick={() => setSummaryModal(null)} className="absolute right-4 top-4 text-white/40"><X size={24} /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-[#C45000] flex items-center justify-center text-2xl">📊</div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{language === 'hi-IN' ? 'आज का हिसाब' : "Today's Summary"}</h2>
            </div>
            <p className="text-white/80 leading-relaxed font-medium text-lg italic">{summaryModal?.text}</p>
          </div>
          <div className="p-8 bg-slate-50">
            <a 
              href={summaryModal?.whatsappUrl} 
              target="_blank" 
              className="w-full h-16 rounded-[24px] bg-[#1A6B3C] text-white flex items-center justify-center gap-3 text-lg font-black uppercase shadow-xl shadow-[#1A6B3C]/20 active:scale-95 transition-all"
            >
              <MessageCircle size={24} />
              {texts.share}
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 pb-safe z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center max-w-md mx-auto relative h-16">
          <NavBtn icon={<Home size={22} />} label={texts.dukaan} active={activeTab === 'dukaan'} onClick={() => setActiveTab('dukaan')} />
          <NavBtn 
            icon={<Package size={22} />} 
            label={texts.stock} 
            active={activeTab === 'stock'} 
            onClick={() => setActiveTab('stock')} 
            badge={redItemsCount > 0 ? redItemsCount : undefined}
          />
          
          <div className="relative -top-8 flex flex-col items-center">
            <VoiceButton 
              language={language} 
              privateMode={privateMode} 
              onTransactionSuccess={handleTransaction} 
              onSummaryRequested={handleDailySummary}
              salesHistory={sales}
              businessType={profile?.businessType}
              stock={stock}
              compact
              khata={creditKhata}
            />
          </div>

          <NavBtn icon={<BookOpen size={22} />} label={texts.khata} active={activeTab === 'khata'} onClick={() => setActiveTab('khata')} />
          {role === 'owner' && (
            <NavBtn icon={<BarChart3 size={22} />} label={texts.report} active={activeTab === 'report'} onClick={() => setActiveTab('report')} />
          )}
          <NavBtn icon={<UserSquare2 size={22} />} label={texts.customer} active={isCustomerView} onClick={() => setIsCustomerView(true)} />
        </div>
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, disabled, badge }: { icon: any, label: string, active: boolean, onClick: () => void, disabled?: boolean, badge?: number }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn("flex flex-col items-center gap-1 min-w-[56px] transition-all relative", active ? "text-[#C45000]" : "text-slate-400", disabled && "opacity-20")}>
      <div className={cn("transition-transform", active && "scale-110")}>
        {icon}
        {badge !== undefined && (
          <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
            {badge}
          </div>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
      {active && <div className="w-1 h-1 rounded-full bg-[#C45000] mt-0.5" />}
    </button>
  );
}
