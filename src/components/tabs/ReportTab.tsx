"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Calendar, MessageCircle, Bell, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, parseISO } from "date-fns";

interface ReportTabProps {
  role: "owner" | "helper";
  privateMode: boolean;
  language: "hi-IN" | "en-IN";
  sales: any[];
  expenses: any[];
  profile: any;
  reminders?: any[];
  onUpdateReminders?: (updated: any[]) => void;
}

export default function ReportTab({ language, privateMode, sales, expenses, profile, reminders = [], onUpdateReminders }: ReportTabProps) {
  const [revealProfit, setRevealProfit] = useState(false);
  const { toast } = useToast();

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
  const todayExpenses = expenses.filter(e => new Date(e.timestamp).toDateString() === today);

  const totalRevenue = todaySales.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExp = todayExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netProfit = totalRevenue - totalExp;

  const handleReminderWhatsApp = (reminder: any) => {
    const shopName = profile?.shopName || "BolVyaapar Shop";
    const msg = language === 'hi-IN'
      ? `नमस्ते ${reminder.customerName}, ${shopName} से एक छोटा रिमाइंडर: ${reminder.message}. धन्यवाद!`
      : `Hi ${reminder.customerName}, a friendly reminder from ${shopName}: ${reminder.message}. Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDeleteReminder = (id: number) => {
    if (onUpdateReminders) {
      onUpdateReminders(reminders.filter(r => r.id !== id));
      toast({ title: language === 'hi-IN' ? "हटा दिया गया" : "Reminder Removed" });
    }
  };

  const todaysReminders = reminders.filter(r => isSameDay(parseISO(r.date), new Date()));

  const customerStats = useMemo(() => {
    const stats: Record<string, any> = {};
    sales.forEach(sale => {
      const name = sale.customer || (language === 'hi-IN' ? 'ग्राहक' : 'Customer');
      if (!stats[name]) {
        stats[name] = { name, totalSpent: 0, visits: 0, lastVisit: sale.timestamp, items: {} };
      }
      stats[name].totalSpent += sale.amount;
      stats[name].visits += 1;
      if (new Date(sale.timestamp) > new Date(stats[name].lastVisit)) {
        stats[name].lastVisit = sale.timestamp;
      }
      const item = sale.item;
      stats[name].items[item] = (stats[name].items[item] || 0) + 1;
    });

    return Object.values(stats)
      .filter(c => c.name !== 'ग्राहक' && c.name !== 'Customer')
      .map(c => ({
        ...c,
        favoriteProduct: Object.entries(c.items).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '---'
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }, [sales, language]);

  const texts = {
    "hi-IN": {
      title: "रिपोर्ट",
      revenue: "आज की कुल बिक्री",
      profit: "आज का मुनाफा", 
      customers: "खास ग्राहक", 
      reveal: "देखें", 
      hide: "छिपाएं",
      reminderTitle: "आज के रिमाइंडर", 
      noReminders: "आज कोई काम नहीं है",
      ownerTask: "मेरा काम",
      visited: "बार आए"
    },
    "en-IN": {
      title: "Report",
      revenue: "TODAY'S REVENUE",
      profit: "NET PROFIT", 
      customers: "TOP CUSTOMERS", 
      reveal: "Reveal", 
      hide: "Hide",
      reminderTitle: "Today's Reminders", 
      noReminders: "No reminders for today",
      ownerTask: "Owner Task",
      visited: "Visited"
    }
  }[language];

  return (
    <div className="space-y-6 pb-48 animate-in fade-in slide-in-from-bottom-4">
      <div className="px-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{texts.title}</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-[#0D2240] border-none rounded-[32px] overflow-hidden shadow-2xl">
          <CardContent className="p-8 relative">
            <TrendingUp size={80} className="absolute right-[-10px] bottom-[-10px] text-white/5" />
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">{texts.revenue}</p>
            <p className={cn("text-[26px] font-black text-white", privateMode && "blur-xl")}>₹{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-slate-900 text-lg font-black tracking-tight">{texts.reminderTitle}</h3>
          <Bell size={20} className="text-[#C45000]" />
        </div>
        {todaysReminders.length === 0 ? (
          <Card className="rounded-[24px] border-dashed border-slate-200 bg-white/50 p-6 text-center">
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{texts.noReminders}</p>
          </Card>
        ) : (
          todaysReminders.map((r) => (
            <Card key={r.id} className="rounded-[24px] border-slate-100 shadow-sm bg-white overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{r.customerName || texts.ownerTask}</h4>
                    <p className="text-xs text-slate-500 italic">"{r.message}"</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {r.customerName && (
                    <button onClick={() => handleReminderWhatsApp(r)} className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                      <MessageCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteReminder(r.id)} className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={18} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="rounded-[32px] border-slate-100 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-8 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-slate-400">{texts.profit}</p>
            {revealProfit ? <p className={cn("text-[28px] font-black", netProfit >= 0 ? "text-[#1A6B3C]" : "text-red-600")}>₹{netProfit.toLocaleString()}</p> : <p className="text-[28px] font-black text-slate-200">₹••••••</p>}
          </div>
          <button onClick={() => setRevealProfit(!revealProfit)} className="h-12 w-24 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-[#C45000] border border-slate-100 shadow-sm">{revealProfit ? texts.hide : texts.reveal}</button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-slate-900 text-lg font-black tracking-tight px-1">{texts.customers}</h3>
        {customerStats.map((customer, idx) => (
          <Card key={idx} className="rounded-[24px] border-slate-100 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-4 flex gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shrink-0">{idx === 0 ? '👑' : '👤'}</div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">{customer.name}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                      <Calendar size={10} /> {format(new Date(customer.lastVisit), 'MMM d')}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-[#1A6B3C]">₹{customer.totalSpent}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">{customer.visits} {texts.visited}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
