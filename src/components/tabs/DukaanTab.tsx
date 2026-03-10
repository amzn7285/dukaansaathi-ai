"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Eye, BarChart2, Loader2, Wallet, Scissors, Wrench, Utensils, Truck, ShoppingBasket, Sparkles } from "lucide-react";

interface DukaanTabProps {
  role: "owner" | "helper";
  privateMode: boolean;
  language: "hi-IN" | "en-IN";
  sales: any[];
  expenses: any[];
  profile: any;
  totalOutstanding: number;
  onGenerateSummary: () => void;
  isGeneratingSummary?: boolean;
}

export default function DukaanTab({ role, privateMode, language, sales, expenses, profile, totalOutstanding, onGenerateSummary, isGeneratingSummary }: DukaanTabProps) {
  const isHelper = role === "helper";
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
  const todayExpenses = expenses.filter(e => new Date(e.timestamp).toDateString() === today);
  
  const totalAmount = todaySales.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExp = todayExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const count = todaySales.length;

  const texts = {
    "hi-IN": { todaySales: "आज की बिक्री", todayExp: "आज के खर्चे", recent: "हाल की बिक्री", outstanding: "उधार बाकी", summaryTitle: "आज का हिसाब", summarySub: "AI से रिपोर्ट सुनें", txns: "लेन-देन" },
    "en-IN": { todaySales: "Today's Sales", todayExp: "Today's Expenses", recent: "Recent Activity", outstanding: "Outstanding", summaryTitle: "Today's Summary", summarySub: "Listen to AI Report", txns: "txns" }
  }[language];

  const getBizIcon = () => {
    switch (profile?.businessType) {
      case 'tailor': return <Scissors size={24} />;
      case 'repair': return <Wrench size={24} />;
      case 'dhaba': return <Utensils size={24} />;
      case 'milk': return <Truck size={24} />;
      default: return <ShoppingBasket size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      {!isHelper && (
        <button onClick={onGenerateSummary} disabled={isGeneratingSummary || count === 0} className="w-full h-24 flex items-center justify-between px-6 bg-gradient-to-r from-[#C45000] to-[#E65C00] text-white rounded-[32px] shadow-2xl active:scale-95 transition-all disabled:opacity-50 overflow-hidden group">
          <Sparkles size={80} className="absolute right-[-10px] top-[-10px] text-white/10 rotate-12" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-16 w-16 rounded-[24px] bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl">🌙</div>
            <div className="text-left">
              <h3 className="text-2xl font-black uppercase tracking-tight">{texts.summaryTitle}</h3>
              <p className="text-[11px] font-black text-white/60 uppercase tracking-widest">{texts.summarySub}</p>
            </div>
          </div>
          <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
            {isGeneratingSummary ? <Loader2 size={24} className="animate-spin" /> : <BarChart2 size={28} />}
          </div>
        </button>
      )}

      <div className={cn("grid gap-4", isHelper ? "grid-cols-1" : "grid-cols-2")}>
        <Card className="bg-[#0D2240] border-none rounded-[32px] overflow-hidden shadow-xl h-32 flex flex-col justify-center px-6">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{texts.todaySales}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#C45000]">₹</span>
            <span className={cn("text-3xl font-black text-white", (privateMode || isHelper) && "blur-xl")}>
              {isHelper ? "***" : totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded-full w-fit">
            <p className="text-white/60 font-black text-[10px]">{count} {texts.txns}</p>
          </div>
        </Card>

        {!isHelper && (
          <Card className="bg-white border-slate-100 rounded-[32px] shadow-sm h-32 flex flex-col justify-center px-6">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{texts.todayExp}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-red-400">₹</span>
              <span className={cn("text-3xl font-black text-red-600", privateMode && "blur-md")}>
                {totalExp.toLocaleString()}
              </span>
            </div>
          </Card>
        )}
      </div>

      {!isHelper && (
        <Card className={cn("rounded-[32px] shadow-sm border-2 h-28 flex items-center px-6", totalOutstanding > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200")}>
          <div className="flex items-center gap-4">
            <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center", totalOutstanding > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
              <Wallet size={28} />
            </div>
            <div>
              <p className={cn("text-[11px] font-black uppercase tracking-widest", totalOutstanding > 0 ? "text-red-500" : "text-emerald-500")}>{texts.outstanding}</p>
              <p className={cn("text-3xl font-black", totalOutstanding > 0 ? "text-red-700" : "text-emerald-700", privateMode && "blur-md")}>₹{totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-slate-900 text-xl font-black px-1">{texts.recent}</h3>
        <div className="space-y-3">
          {sales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="bg-white border border-slate-100 h-20 px-6 rounded-3xl flex items-center justify-between shadow-sm active:bg-slate-50">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl">{getBizIcon()}</div>
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{sale.item}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase">{sale.qty} • {sale.customer}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn("text-2xl font-black text-[#C45000]", (isHelper || privateMode) && "blur-md")}>
                  {isHelper ? "***" : `₹${sale.amount}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}