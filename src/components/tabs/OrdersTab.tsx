"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle2, Clock, Phone, History, ClipboardList, Check, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface OrdersTabProps {
  language: "hi-IN" | "en-IN";
  isService: boolean;
  jobs: any[];
  sales: any[];
  onUpdateJobs: (jobs: any[]) => void;
}

export default function OrdersTab({ language, isService, jobs, sales, onUpdateJobs }: OrdersTabProps) {
  const [filter, setFilter] = useState<string>('All');

  const filteredJobs = filter === 'All' ? jobs : jobs.filter(j => j.status === filter);

  const handleUpdateStatus = (jobId: number, nextStatus: string) => {
    const updated = jobs.map(j => j.id === jobId ? { ...j, status: nextStatus } : j);
    onUpdateJobs(updated);
  };

  const handleNotify = (job: any) => {
    const msg = language === 'hi-IN' 
      ? `नमस्ते ${job.customerName}, आपका काम तैयार है। कृपया ले जाएँ। धन्यवाद!`
      : `Hi ${job.customerName}, your order is ready. Please collect it. Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const texts = {
    "hi-IN": { 
      title: isService ? "ऑर्डर और काम" : "बिक्री का इतिहास", 
      empty: "कोई रिकॉर्ड नहीं मिला", 
      statusReady: "तैयार", 
      statusDelivered: "दे दिया", 
      statusReceived: "आया", 
      notify: "बताओ",
      start: "शुरू करें",
      markReady: "तैयार मार्क करें",
      deliver: "दे दिया",
      received: "प्राप्त हुआ",
      advance: "एडवांस",
      balance: "बाकी"
    },
    "en-IN": { 
      title: isService ? "Orders & Jobs" : "Sales History", 
      empty: "No records found", 
      statusReady: "Ready", 
      statusDelivered: "Delivered", 
      statusReceived: "Received", 
      notify: "Notify",
      start: "Start Work",
      markReady: "Mark Ready",
      deliver: "Deliver & Clear",
      received: "Received",
      advance: "Advance",
      balance: "Balance"
    }
  }[language];

  const statusMap: Record<string, string> = language === 'hi-IN' ? {
    'All': 'सब',
    'Received': 'प्राप्त',
    'In Progress': 'चालू',
    'Ready': 'तैयार',
    'Delivered': 'दिया गया'
  } : {
    'All': 'All',
    'Received': 'Received',
    'In Progress': 'In Progress',
    'Ready': 'Ready',
    'Delivered': 'Delivered'
  };

  if (!isService) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-[#0D2240] px-1">{texts.title}</h2>
        <div className="space-y-3">
          {sales.length === 0 ? (
            <div className="py-20 text-center opacity-30 flex flex-col items-center">
              <History size={64} className="mb-4" />
              <p className="font-bold uppercase tracking-widest">{texts.empty}</p>
            </div>
          ) : (
            sales.map((sale) => (
              <Card key={sale.id} className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl">🛍️</div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg">{sale.item}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(sale.timestamp), 'dd MMM, hh:mm a')} • {sale.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#C45000]">₹{sale.amount}</p>
                    <p className="text-[10px] font-black text-slate-300 uppercase">{sale.qty}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black text-[#0D2240]">{texts.title}</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {['All', 'Received', 'In Progress', 'Ready', 'Delivered'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-4 h-10 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
              filter === s ? "bg-[#0D2240] text-white" : "bg-white border border-slate-100 text-slate-400"
            )}
          >
            {statusMap[s]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="py-20 text-center opacity-30 flex flex-col items-center">
            <ClipboardList size={64} className="mb-4" />
            <p className="font-bold uppercase tracking-widest">{texts.empty}</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const balance = job.price - (job.advance || 0);
            return (
              <Card key={job.id} className={cn(
                "rounded-[32px] border-l-8 shadow-md bg-white overflow-hidden",
                job.status === 'Ready' ? "border-l-emerald-500" : job.status === 'Delivered' ? "border-l-slate-300" : "border-l-[#C45000]"
              )}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl">👤</div>
                      <div>
                        <h4 className="text-xl font-black text-slate-800">{job.customerName}</h4>
                        <p className="text-sm font-bold text-[#C45000]">{job.item}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase tracking-widest rounded-lg",
                        job.status === 'Ready' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100"
                      )}>
                        {statusMap[job.status]}
                      </Badge>
                      <p className="text-2xl font-black text-slate-800 mt-2">₹{job.price}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{texts.received}</p>
                      <p className="text-xs font-bold text-slate-700">{format(new Date(job.timestamp), 'dd MMM')}</p>
                    </div>
                    <div className="flex flex-col gap-1 text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{texts.advance}</p>
                      <p className="text-xs font-bold text-emerald-600">₹{job.advance || 0}</p>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <p className="text-[9px] font-black text-red-400 uppercase">{texts.balance}</p>
                      <p className="text-xs font-bold text-red-600">₹{balance}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {job.status === 'Received' && (
                      <Button onClick={() => handleUpdateStatus(job.id, 'In Progress')} className="flex-1 h-14 rounded-2xl bg-[#0D2240] text-white font-black text-xs uppercase">
                        {texts.start}
                      </Button>
                    )}
                    {job.status === 'In Progress' && (
                      <Button onClick={() => handleUpdateStatus(job.id, 'Ready')} className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase">
                        {texts.markReady}
                      </Button>
                    )}
                    {job.status === 'Ready' && (
                      <>
                        <Button onClick={() => handleNotify(job)} variant="outline" className="flex-1 h-14 rounded-2xl border-emerald-200 text-emerald-600 font-black text-xs uppercase gap-2">
                          <MessageCircle size={18} /> {texts.notify}
                        </Button>
                        <Button onClick={() => handleUpdateStatus(job.id, 'Delivered')} className="flex-1 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase">
                          {texts.deliver}
                        </Button>
                      </>
                    )}
                    {job.status === 'Delivered' && (
                      <div className="w-full h-14 flex items-center justify-center gap-2 text-slate-300 font-black text-xs uppercase">
                        <CheckCircle2 size={20} /> {statusMap['Delivered']}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}