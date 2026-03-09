"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Home, Package, BarChart3, Lock, BookOpen, Eye, EyeOff, MessageCircle, X, Sparkles, ShieldAlert, Settings, ClipboardList, Bell } from "lucide-react";
import DukaanTab from "./tabs/DukaanTab";
import StockTab from "./tabs/StockTab";
import ReportTab from "./tabs/ReportTab";
import SettingsTab from "./tabs/SettingsTab";
import CreditKhataTab from "./tabs/CreditKhataTab";
import OrdersTab from "./tabs/OrdersTab";
import VoiceButton from "./VoiceButton";
import ConnectivityBanner from "./ConnectivityBanner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isSameDay, parseISO } from "date-fns";

interface DashboardProps {
  role: "owner" | "helper";
  language: "hi-IN" | "en-IN";
  onLogout: () => void;
}

const SALES_STORAGE_KEY = "bolvyaapar_sales_history";
const EXPENSES_STORAGE_KEY = "bolvyaapar_expenses_history";
const STOCK_STORAGE_KEY = "bolvyaapar_stock_data";
const CREDIT_KHATA_KEY = "bolvyaapar_credit_khata";
const JOBS_STORAGE_KEY = "bolvyaapar_jobs_data";
const PROFILE_KEY = "bolvyaapar_profile";
const REMINDERS_STORAGE_KEY = "bolvyaapar_reminders_data";
const BRIEFING_KEY = "bolvyaapar_last_briefing_date";

const BUSINESS_TYPES = [
  { id: 'kirana', emoji: '🏪', en: "Kirana Store", hi: "किराना स्टोर", isService: false },
  { id: 'dhaba', emoji: '🍵', en: "Dhaba", hi: "ढाबा", isService: false },
  { id: 'tailor', emoji: '✂️', en: "Tailor", hi: "दर्जी", isService: true },
  { id: 'repair', emoji: '🔧', en: "Repair Shop", hi: "रिपेयर शॉप", isService: true },
  { id: 'milk', emoji: '🥛', en: "Milk Delivery", hi: "दूध की डिलीवरी", isService: false },
  { id: 'medical', emoji: '💊', en: "Medical Store", hi: "मेडिकल स्टोर", isService: false },
  { id: 'salon', emoji: '💇', en: "Salon", hi: "सैलून", isService: true },
  { id: 'other', emoji: '📦', en: "Other Biz", hi: "अन्य व्यापार", isService: false },
];

export default function Dashboard({ role, language, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dukaan");
  const [privateMode, setPrivateMode] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [creditKhata, setCreditKhata] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryModal, setSummaryModal] = useState<{ show: boolean, text: string, whatsappUrl: string } | null>(null);

  const isHelper = role === "helper";

  useEffect(() => {
    const loadData = () => {
      const savedSales = localStorage.getItem(SALES_STORAGE_KEY);
      if (savedSales) try { setSales(JSON.parse(savedSales)); } catch (e) { console.error(e); }

      const savedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (savedExpenses) try { setExpenses(JSON.parse(savedExpenses)); } catch (e) { console.error(e); }

      const savedStock = localStorage.getItem(STOCK_STORAGE_KEY);
      if (savedStock) try { setStock(JSON.parse(savedStock)); } catch (e) { console.error(e); }

      const savedKhata = localStorage.getItem(CREDIT_KHATA_KEY);
      if (savedKhata) try { setCreditKhata(JSON.parse(savedKhata)); } catch (e) { console.error(e); }

      const savedJobs = localStorage.getItem(JOBS_STORAGE_KEY);
      if (savedJobs) try { setJobs(JSON.parse(savedJobs)); } catch (e) { console.error(e); }

      const savedReminders = localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (savedReminders) try { setReminders(JSON.parse(savedReminders)); } catch (e) { console.error(e); }

      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) try { setProfile(JSON.parse(savedProfile)); } catch (e) { console.error(e); }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isHelper || !reminders || reminders.length === 0) return;

    const today = new Date();
    const lastBriefing = localStorage.getItem(BRIEFING_KEY);
    
    if (!lastBriefing || !isSameDay(parseISO(lastBriefing), today)) {
      const todaysReminders = reminders.filter(r => isSameDay(parseISO(r.date), today));
      
      if (todaysReminders.length > 0) {
        const intro = language === 'hi-IN' ? "आज के लिए कुछ जरूरी काम हैं:" : "You have some tasks for today:";
        const items = todaysReminders.map(r => 
          r.customerName 
            ? (language === 'hi-IN' ? `${r.customerName} को याद दिलाना है: ${r.message}` : `Remind ${r.customerName}: ${r.message}`)
            : r.message
        ).join(". ");
        
        const utterance = new SpeechSynthesisUtterance(`${intro} ${items}`);
        utterance.lang = language;
        window.speechSynthesis.speak(utterance);
        
        localStorage.setItem(BRIEFING_KEY, today.toISOString());
      }
    }
  }, [reminders, isHelper, language]);

  const handleTransaction = (details: any) => {
    const timestamp = new Date().toISOString();
    
    if (details.intent === 'reminder') {
      const newReminder = {
        id: Date.now(),
        timestamp,
        customerName: details.customerName || null,
        message: details.message || details.productName,
        date: details.date || timestamp,
        completed: false
      };
      const updatedReminders = [newReminder, ...reminders];
      setReminders(updatedReminders);
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updatedReminders));
      return;
    }

    if (details.intent === 'job_complete') {
      const updatedJobs = jobs.map(j => {
        if (j.customerName?.toLowerCase() === details.customerName?.toLowerCase() && (j.status === 'Received' || j.status === 'In Progress')) {
          return { ...j, status: 'Ready' };
        }
        return j;
      });
      setJobs(updatedJobs);
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updatedJobs));
      
      const shopName = profile?.shopName || "BolVyaapar Shop";
      const msg = `नमस्ते ${details.customerName}, आपका काम तैयार है — आ जाइये। धन्यवाद! - ${shopName}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      return;
    }

    if (details.intent === 'job_create') {
      const total = details.price || 0;
      const advance = details.advance || 0;
      const balance = Math.max(0, total - advance);

      const newJob = {
        id: Date.now(),
        timestamp,
        customerName: details.customerName,
        item: details.productName,
        problem: details.description || details.productName,
        price: total,
        advance: advance,
        status: 'Received',
        dueDate: details.dueDate || null
      };
      const updatedJobs = [newJob, ...jobs];
      setJobs(updatedJobs);
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updatedJobs));

      if (balance > 0 || advance > 0) {
        let exists = false;
        const updatedKhata = creditKhata.map(c => {
          if (c.name.toLowerCase() === details.customerName?.toLowerCase()) {
            exists = true;
            const entry = { id: Date.now(), timestamp, type: 'advance_job', amount: balance, note: `Job: ${details.productName} (Total: ${total}, Adv: ${advance})` };
            return { ...c, balance: (c.balance || 0) + balance, history: [entry, ...(c.history || [])], isService: true };
          }
          return c;
        });

        if (!exists) {
          const entry = { id: Date.now(), timestamp, type: 'advance_job', amount: balance, note: `Job: ${details.productName} (Total: ${total}, Adv: ${advance})` };
          updatedKhata.unshift({ id: Date.now(), name: details.customerName, phone: "", balance: balance, history: [entry], isService: true });
        }
        setCreditKhata(updatedKhata);
        localStorage.setItem(CREDIT_KHATA_KEY, JSON.stringify(updatedKhata));
      }
      return;
    }

    if (details.isExpense) {
      const newExpense = { id: Date.now(), timestamp, category: details.productName || (language === 'hi-IN' ? 'खर्चा' : 'Expense'), amount: details.price || 0 };
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses));
      return;
    }

    if (details.isCredit || details.intent === 'credit') {
      let exists = false;
      const updatedKhata = creditKhata.map(c => {
        if (c.name.toLowerCase() === details.customerName?.toLowerCase()) {
          exists = true;
          const entry = { id: Date.now(), timestamp, type: 'credit', amount: details.price || 0, note: details.productName || (language === 'hi-IN' ? 'उधार' : 'Credit') };
          return { ...c, balance: (c.balance || 0) + (details.price || 0), history: [entry, ...(c.history || [])] };
        }
        return c;
      });
      if (!exists) {
        const entry = { id: Date.now(), timestamp, type: 'credit', amount: details.price || 0, note: details.productName || (language === 'hi-IN' ? 'उधार' : 'Credit') };
        updatedKhata.unshift({ id: Date.now(), name: details.customerName, phone: "", balance: details.price || 0, history: [entry] });
      }
      setCreditKhata(updatedKhata);
      localStorage.setItem(CREDIT_KHATA_KEY, JSON.stringify(updatedKhata));
    }

    if (details.isPayment || details.intent === 'payment') {
      const updatedKhata = creditKhata.map(c => {
        if (c.name.toLowerCase() === details.customerName?.toLowerCase()) {
          const entry = { id: Date.now(), timestamp, type: 'payment', amount: details.price || 0, note: language === 'hi-IN' ? 'जमा' : 'Received payment' };
          return { ...c, balance: Math.max(0, (c.balance || 0) - (details.price || 0)), history: [entry, ...(c.history || [])], lastPaymentAt: timestamp };
        }
        return c;
      });
      setCreditKhata(updatedKhata);
      localStorage.setItem(CREDIT_KHATA_KEY, JSON.stringify(updatedKhata));

      const bizInfo = BUSINESS_TYPES.find(b => b.id === profile?.businessType);
      if (bizInfo?.isService) {
        const updatedJobs = jobs.map(j => {
          if (j.customerName?.toLowerCase() === details.customerName?.toLowerCase() && j.status === 'Ready') {
            return { ...j, status: 'Delivered' };
          }
          return j;
        });
        setJobs(updatedJobs);
        localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updatedJobs));
      }
      return;
    }

    const newSale = { id: Date.now(), timestamp, item: details.productName || "Unknown Item", qty: details.quantity ? `${details.quantity} ${details.unit || ''}` : "---", customer: details.customerName || (language === 'hi-IN' ? 'ग्राहक' : 'Customer'), amount: details.price || 0 };
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updatedSales));

    const soldQty = Number(details.quantity) || 0;
    const prodName = (details.productName || "").toLowerCase();
    const updatedStock = stock.map(item => {
      let isMatch = false;
      if (prodName.includes(item.name.toLowerCase()) || prodName.includes((item.hiName || "").toLowerCase()) || details.matchedCategory === item.name) isMatch = true;
      if (isMatch) {
        const newQty = Math.max(0, item.qty - soldQty);
        return { ...item, qty: newQty, level: (newQty / (item.maxQty || 100)) * 100 };
      }
      return item;
    });
    setStock(updatedStock);
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(updatedStock));
  };

  const handleDailySummary = async () => {
    if (isGeneratingSummary || isHelper) return;
    setIsGeneratingSummary(true);

    const todayStr = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === todayStr);
    const count = todaySales.length;
    const itemMap: Record<string, number> = {};
    todaySales.forEach(s => { itemMap[s.item] = (itemMap[s.item] || 0) + (parseFloat(s.qty) || 1); });
    const bestSeller = Object.entries(itemMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "---";

    const systemPrompt = `Closing summary. Sales: ${count}. Best: ${bestSeller}. Language: ${language === 'hi-IN' ? 'Hindi' : 'English'}. No money totals. Business: ${profile?.businessType}`;

    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userMessage: "Summary", systemPrompt }) });
      const data = await response.json();
      const text = data.reply || "";
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);

      const shareMsg = `📊 *आज का हिसाब: ${profile?.shopName}*\n✅ ${count} बिक्री\n🔥 खास: ${bestSeller}\n_BolVyaapar AI_`;
      setSummaryModal({ show: true, text, whatsappUrl: `https://wa.me/${profile?.ownerPhone}?text=${encodeURIComponent(shareMsg)}` });
    } catch (err) {
      setSummaryModal({ show: true, text: "Offline report ready.", whatsappUrl: `https://wa.me/${profile?.ownerPhone}?text=Summary` });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const totalOutstanding = creditKhata.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const redItemsCount = stock.filter(item => item.level < 15).length;
  const bizInfo = BUSINESS_TYPES.find(b => b.id === profile?.businessType) || BUSINESS_TYPES[0];

  const texts = {
    "hi-IN": { dukaan: "दुकान", stock: "स्टॉक", khata: "खाता", report: "रिपोर्ट", activity: bizInfo.isService ? "ऑर्डर" : "हिसाब", share: "WhatsApp पर भेजें", tagline: "Bolkar Chalao AI Se Karobaar — बोलकर चलाओ AI से कारोबार" },
    "en-IN": { dukaan: "Dukaan", stock: "Stock", khata: "Khata", report: "Report", activity: bizInfo.isService ? "Orders" : "History", share: "Share on WhatsApp", tagline: "Bolkar Chalao AI Se Karobaar — बोलकर चलाओ AI से कारोबार" }
  }[language];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      <ConnectivityBanner language={language} />
      
      {isHelper && (
        <div className="bg-[#38BDF8]/20 text-[#38BDF8] px-4 py-2 flex items-center justify-center gap-2 z-[100] shadow-md border-b border-[#38BDF8]/10">
          <ShieldAlert size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Helper Mode</span>
        </div>
      )}
      
      <header className="bg-[#0D2240] px-6 py-5 flex items-center justify-between shadow-xl z-20 shrink-0 border-b border-white/5">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1 opacity-80">
             <span className="text-[#38BDF8] font-black text-[10px] uppercase tracking-tighter">BolVyaapar</span>
             <span className="text-[#FFB300] font-black text-[10px]">AI</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight truncate max-w-[180px]">
            {profile?.shopName || 'BolVyaapar Shop'}
          </h1>
          <p className="text-[10px] text-[#FFB300] font-bold italic tracking-tight mb-0.5">
            {texts.tagline}
          </p>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
            {bizInfo.emoji} {language === 'hi-IN' ? bizInfo.hi : bizInfo.en}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab("settings")} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/60">
            <Settings size={22} />
          </button>
          {!isHelper && (
            <button onClick={() => setPrivateMode(!privateMode)} className={cn("h-12 w-12 flex items-center justify-center rounded-2xl transition-all", privateMode ? 'bg-[#38BDF8] text-white' : 'bg-white/5 text-white/40')}>
              {privateMode ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          )}
          <button onClick={onLogout} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/40">
            <Lock size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-44 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsContent value="dukaan" className="m-0 p-4">
            <DukaanTab role={role} privateMode={privateMode} language={language} sales={sales} expenses={expenses} profile={profile} totalOutstanding={totalOutstanding} onGenerateSummary={handleDailySummary} isGeneratingSummary={isGeneratingSummary} />
          </TabsContent>
          <TabsContent value="stock" className="m-0 p-4">
            <StockTab role={role} language={language} stock={stock} onAddCategory={(cat) => setStock([...stock, cat])} sales={sales} profile={profile} />
          </TabsContent>
          <TabsContent value="activity" className="m-0 p-4">
            <OrdersTab 
              language={language} 
              isService={bizInfo.isService} 
              jobs={jobs} 
              sales={sales} 
              onUpdateJobs={(updated) => { setJobs(updated); localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated)); }} 
            />
          </TabsContent>
          {!isHelper && (
            <>
              <TabsContent value="khata" className="m-0 p-4">
                <CreditKhataTab language={language} customers={creditKhata} onUpdateCustomers={(k) => { setCreditKhata(k); localStorage.setItem(CREDIT_KHATA_KEY, JSON.stringify(k)); }} profile={profile} sales={sales} jobs={jobs} />
              </TabsContent>
              <TabsContent value="report" className="m-0 p-4">
                <ReportTab 
                  role={role} 
                  privateMode={privateMode} 
                  language={language} 
                  sales={sales} 
                  expenses={expenses} 
                  profile={profile} 
                  reminders={reminders}
                  onUpdateReminders={(updated) => { setReminders(updated); localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updated)); }}
                />
              </TabsContent>
              <TabsContent value="settings" className="m-0 p-4">
                <SettingsTab language={language} profile={profile} onUpdateProfile={(p) => setProfile(p)} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <Dialog open={!!summaryModal} onOpenChange={() => setSummaryModal(null)}>
        <DialogContent className="max-w-[90vw] rounded-[40px] p-0 border-none bg-white overflow-hidden shadow-2xl">
          <div className="bg-[#0D2240] p-8 text-white relative">
            <button onClick={() => setSummaryModal(null)} className="absolute right-4 top-4 text-white/40"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">{language === 'hi-IN' ? 'आज का हिसाब' : "Summary"}</h2>
            <p className="text-white/80 leading-relaxed font-medium text-lg italic">{summaryModal?.text}</p>
          </div>
          <div className="p-8 bg-slate-50">
            <a href={summaryModal?.whatsappUrl} target="_blank" className="w-full h-16 rounded-[24px] bg-[#1A6B3C] text-white flex items-center justify-center gap-3 text-lg font-black uppercase">
              <MessageCircle size={24} /> {texts.share}
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 pb-safe z-[60] shadow-2xl">
        <div className="flex justify-around items-center max-w-md mx-auto relative h-16">
          <NavBtn icon={<Home size={26} />} label={texts.dukaan} active={activeTab === 'dukaan'} onClick={() => setActiveTab('dukaan')} />
          <NavBtn icon={<Package size={26} />} label={texts.stock} active={activeTab === 'stock'} onClick={() => setActiveTab('stock')} badge={redItemsCount > 0 ? redItemsCount : undefined} />
          
          <div className="relative -top-10 flex flex-col items-center">
            <VoiceButton role={role} language={language} privateMode={privateMode} onTransactionSuccess={handleTransaction} businessType={profile?.businessType} stock={stock} khata={creditKhata} compact />
          </div>

          <NavBtn icon={<ClipboardList size={26} />} label={texts.activity} active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />

          {!isHelper && (
            <NavBtn icon={<BarChart3 size={26} />} label={texts.report} active={activeTab === 'report'} onClick={() => setActiveTab('report')} />
          )}
          {isHelper && <NavBtn icon={<BookOpen size={26} />} label={texts.khata} active={false} onClick={() => {}} className="opacity-0 pointer-events-none" />}
        </div>
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, badge, className }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: number, className?: string }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1.5 min-w-[56px] transition-all relative", active ? "text-[#38BDF8]" : "text-slate-400", className)}>
      <div className={cn("transition-transform", active && "scale-110")}>
        {icon}
        {badge !== undefined && <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-white">{badge}</div>}
      </div>
      <span className="text-[11px] font-black uppercase tracking-tight">{label}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] mt-0.5" />}
    </button>
  );
}
