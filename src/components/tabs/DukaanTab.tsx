"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Eye, TrendingUp, BarChart2, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface DukaanTabProps {
  privateMode: boolean;
  language: "hi-IN" | "en-IN";
  sales: any[];
  onGenerateSummary: () => void;
  isGeneratingSummary?: boolean;
}

export default function DukaanTab({ privateMode, language, sales, onGenerateSummary, isGeneratingSummary }: DukaanTabProps) {
  const [revealedSales, setRevealedSales] = useState<Set<number>>(new Set());
  
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
  const totalAmount = todaySales.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const count = todaySales.length;

  const itemCounts: Record<string, number> = {};
  todaySales.forEach(s => {
    itemCounts[s.item] = (itemCounts[s.item] || 0) + 1;
  });
  const bestItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const texts = {
    "hi-IN": {
      todaySales: "आज की बिक्री",
      recentSales: "हाल की बिक्री",
      txns: "लेन-देन",
      tapToReveal: "कीमत देखने के लिए टैप करें",
      empty: "कोई बिक्री नहीं",
      summary: "आज का हिसाब",
      share: "व्हाट्सएप रिपोर्ट"
    },
    "en-IN": {
      todaySales: "Today's Sales",
      recentSales: "Recent Sales",
      txns: "txns",
      tapToReveal: "Tap sale to reveal privately",
      empty: "No sales yet",
      summary: "Today's Summary",
      share: "Share Report"
    }
  }[language];

  const handleShareDailySummary = () => {
    const shopName = "BolVyapar AI Shop";
    const message = language === 'hi-IN'
      ? `📈 *आज का व्यापार सारांश (${format(new Date(), 'dd MMM')})*\n\n✅ कुल बिक्री: ${count} लेन-देन\n🌟 सबसे ज्यादा बिकने वाला: ${bestItem}\n💡 टिप: ${bestItem} का स्टॉक बनाए रखें।\n\n_BolVyapar AI द्वारा भेजा गया_`
      : `📈 *Daily Business Summary (${format(new Date(), 'dd MMM')})*\n\n✅ Total Sales: ${count} transactions\n🌟 Top Seller: ${bestItem}\n💡 Tip: Keep ${bestItem} stock ready for high demand.\n\n_Sent via BolVyapar AI_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    toast({ title: "Opening WhatsApp..." });
  };

  return (
    <div className="space-y-6">
      {/* Today's Sales Card */}
      <Card className="bg-[#0D2240] border-none rounded-[24px] overflow-hidden shadow-xl">
        <CardContent className="p-6 relative">
          <TrendingUp size={64} className="absolute right-[-10px] bottom-[-10px] text-white/5 rotate-12" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">{texts.todaySales}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#C45000]">₹</span>
                <span className={cn("text-[32px] font-black text-white transition-all", privateMode && "blur-xl")}>
                  {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={onGenerateSummary}
                disabled={isGeneratingSummary || count === 0}
                className="flex items-center gap-2 px-3 py-2 bg-[#C45000] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isGeneratingSummary ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
                {texts.summary}
              </button>
              <button 
                onClick={handleShareDailySummary}
                disabled={count === 0}
                className="flex items-center gap-2 px-3 py-2 bg-[#1A6B3C] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                <Share2 size={14} />
                {texts.share}
              </button>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1A6B3C]" />
            <p className="text-white/60 font-bold text-xs">{count} {texts.txns}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales List */}
      <div className="space-y-4">
        <div className="px-1 flex justify-between items-baseline">
          <h3 className="text-slate-900 text-lg font-black tracking-tight">{texts.recentSales}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase">{texts.tapToReveal}</p>
        </div>
        
        <div className="space-y-3">
          {sales.length === 0 ? (
            <div className="text-center py-12 opacity-40">
              <span className="text-4xl block mb-2">📋</span>
              <p className="text-sm font-bold">{texts.empty}</p>
            </div>
          ) : (
            sales.map((sale) => (
              <div 
                key={sale.id} 
                onClick={() => {
                  setRevealedSales(prev => {
                    const next = new Set(prev);
                    next.has(sale.id) ? next.delete(sale.id) : next.add(sale.id);
                    return next;
                  });
                }}
                className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between shadow-sm active:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl">
                    {sale.item.toLowerCase().includes('milk') || sale.item.toLowerCase().includes('दूध') ? '🥛' : 
                     sale.item.toLowerCase().includes('grain') || sale.item.toLowerCase().includes('अनाज') ? '🌾' : 
                     sale.item.toLowerCase().includes('soap') || sale.item.toLowerCase().includes('साबुन') ? '🧼' : '🛍️'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{sale.item}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {sale.qty} • {sale.customer} • {format(new Date(sale.timestamp), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {revealedSales.has(sale.id) ? (
                    <span className="text-[22px] font-black text-[#C45000] animate-in zoom-in-95">₹{sale.amount}</span>
                  ) : (
                    <div className="flex items-center gap-2 h-10 px-4 bg-slate-50 rounded-xl text-[10px] font-bold uppercase text-slate-400 border border-slate-100">
                      <Eye size={14} /> Reveal
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
