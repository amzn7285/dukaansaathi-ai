"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, MessageCircle, Phone, History, Camera, ArrowUpRight, ArrowDownLeft, X, Loader2, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";

interface CreditKhataTabProps {
  language: "hi-IN" | "en-IN";
  customers: any[];
  onUpdateCustomers: (customers: any[]) => void;
  profile: any;
  sales: any[];
  jobs?: any[];
}

export default function CreditKhataTab({ language, customers, onUpdateCustomers, profile, sales, jobs = [] }: CreditKhataTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  const handleSendReminder = async (customer: any) => {
    const shopName = profile?.shopName || "BolVyaapar AI Shop";
    const systemPrompt = `Create a friendly 1-sentence WhatsApp reminder for a customer who owes money. 
    Customer: ${customer.name}. Amount: ₹${customer.balance}. Shop: ${shopName}. 
    Language: ${language === 'hi-IN' ? 'Hindi' : 'English'}. NO Net Profit details.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: "Generate reminder", systemPrompt }),
      });
      const data = await response.json();
      const message = data.reply || (language === 'hi-IN' ? `नमस्ते ${customer.name}, आपका ₹${customer.balance} बकाया है।` : `Hi ${customer.name}, you have ₹${customer.balance} pending.`);
      window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
    }
  };

  const takePhoto = () => {
    const message = language === 'hi-IN' 
      ? `नमस्ते ${selectedCustomer.name}, यहाँ आपके हिसाब की फोटो है:`
      : `Hi ${selectedCustomer.name}, here is a photo of your ledger page:`;
    window.open(`https://wa.me/${selectedCustomer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    setIsCameraOpen(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const getDaysSince = (dateString: string | null) => {
    if (!dateString) return "---";
    const days = differenceInDays(new Date(), new Date(dateString));
    return days === 0 ? "Today" : `${days} days ago`;
  };

  const getCustomerLastItems = (name: string) => {
    return sales
      .filter(s => s.customer?.toLowerCase() === name.toLowerCase())
      .slice(0, 3)
      .map(s => s.item)
      .join(", ");
  };

  const texts = {
    "hi-IN": { title: "क्रेडिट खाता (Udhar)", search: "नाम से खोजें", empty: "कोई ग्राहक नहीं मिला", history: "हिसाब", balance: "बाकी", remind: "रिमाइंडर", camera: "फोटो भेजें", lastItems: "पिछला सामान", lastPay: "पिछली जमा", advance: "एडवांस" },
    "en-IN": { title: "Credit Khata", search: "Search by name", empty: "No customers found", history: "History", balance: "Due", remind: "Remind", camera: "Photo Share", lastItems: "Last Bought", lastPay: "Last Paid", advance: "Advance" }
  }[language];

  return (
    <div className="space-y-6">
      <div className="px-1">
        <h2 className="text-2xl font-black text-[#0D2240]">{texts.title}</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={22} />
        <Input 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder={texts.search} 
          className="h-16 pl-14 rounded-2xl border-slate-100 shadow-sm bg-white text-lg font-medium" 
        />
      </div>

      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-20 opacity-30 flex flex-col items-center">
            <Sparkles size={64} className="mb-4" />
            <p className="text-xl font-bold uppercase tracking-widest">{texts.empty}</p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const hasActiveJob = jobs.some(j => j.customerName?.toLowerCase() === customer.name.toLowerCase() && j.status !== 'Delivered');
            const isFullyPaid = customer.balance === 0;
            const isAdvance = hasActiveJob && !isFullyPaid;

            return (
              <Card key={customer.id} className={cn(
                "rounded-[32px] border-slate-100 shadow-md bg-white overflow-hidden active:scale-[0.98] transition-all border-l-8",
                isFullyPaid ? "border-l-emerald-500" : isAdvance ? "border-l-blue-500" : "border-l-red-500"
              )}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-3xl",
                        isFullyPaid ? "bg-emerald-50 text-emerald-600" : isAdvance ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                      )}>
                        {customer.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-800">{customer.name}</h4>
                        <p className="text-xs text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tighter"><Phone size={12} /> {customer.phone || '---'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest mb-1",
                        isFullyPaid ? "text-emerald-400" : isAdvance ? "text-blue-400" : "text-red-400"
                      )}>
                        {isFullyPaid ? 'Settled' : isAdvance ? texts.advance : texts.balance}
                      </p>
                      <p className={cn(
                        "text-4xl font-black",
                        isFullyPaid ? "text-emerald-600" : isAdvance ? "text-blue-600" : "text-red-600"
                      )}>
                        ₹{customer.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{texts.lastPay}</p>
                      <p className="text-sm font-black text-slate-700">{getDaysSince(customer.lastPaymentAt)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{texts.lastItems}</p>
                      <p className="text-sm font-black text-slate-700 truncate">{getCustomerLastItems(customer.name) || '---'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => { setSelectedCustomer(customer); startCamera(); }} 
                      variant="outline" 
                      className="flex-1 h-14 rounded-2xl border-slate-100 text-slate-500 font-black text-xs uppercase gap-3 shadow-sm"
                    >
                      <Camera size={20} className="text-[#C45000]" /> {texts.camera}
                    </Button>
                    <Button 
                      onClick={() => handleSendReminder(customer)} 
                      className="flex-1 h-14 rounded-2xl bg-[#1A6B3C] text-white font-black text-xs uppercase gap-3 shadow-xl shadow-[#1A6B3C]/20"
                    >
                      <MessageCircle size={20} /> {texts.remind}
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => setSelectedCustomer(customer)} 
                    variant="ghost" 
                    className="w-full text-[10px] font-black uppercase text-slate-400 tracking-widest"
                  >
                    <History size={14} className="mr-2" /> {texts.history}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!selectedCustomer && !isCameraOpen} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-[95vw] h-[85vh] flex flex-col p-0 border-none rounded-t-[40px] overflow-hidden">
          {selectedCustomer && (
            <>
              <div className="bg-[#0D2240] p-10 text-white relative">
                <button onClick={() => setSelectedCustomer(null)} className="absolute right-6 top-6 p-2 text-white/40"><X size={28} /></button>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black">{selectedCustomer.name}</h2>
                  <p className="text-white/40 text-xs font-black uppercase tracking-widest">{selectedCustomer.phone}</p>
                </div>
                <div className="mt-8 flex items-baseline gap-2">
                  <span className="text-white/40 text-sm font-black uppercase">Total Due</span>
                  <span className="text-5xl font-black text-[#FFB300]">₹{selectedCustomer.balance.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 overflow-y-auto p-6 space-y-4">
                {selectedCustomer.history?.length === 0 ? (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center">
                    <History size={48} className="mb-2" />
                    <p className="font-black uppercase text-sm tracking-widest">No History Yet</p>
                  </div>
                ) : (
                  selectedCustomer.history.map((entry: any) => (
                    <div key={entry.id} className="bg-white p-5 rounded-[24px] flex items-center justify-between border border-slate-100 shadow-sm">
                      <div className="flex gap-4 items-center">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          entry.type === 'payment' ? "bg-emerald-50 text-emerald-600" : entry.type === 'advance_job' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                        )}>
                          {entry.type === 'payment' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-800">{entry.note}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase">{format(new Date(entry.timestamp), 'dd MMM, hh:mm a')}</p>
                        </div>
                      </div>
                      <p className={cn(
                        "text-xl font-black",
                        entry.type === 'payment' ? "text-emerald-600" : entry.type === 'advance_job' ? "text-blue-600" : "text-red-600"
                      )}>
                        {entry.type === 'payment' ? '-' : '+'} ₹{entry.amount.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-full h-svh p-0 border-none rounded-none bg-black flex flex-col items-center justify-center">
          <div className="relative w-full flex-1">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <button onClick={() => setIsCameraOpen(false)} className="absolute top-8 right-6 h-12 w-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md">
              <X size={24} />
            </button>
          </div>
          <div className="h-40 bg-black w-full flex items-center justify-center gap-12 px-8">
            <button onClick={takePhoto} className="h-20 w-20 rounded-full border-4 border-white bg-transparent flex items-center justify-center active:scale-90 transition-all">
              <div className="h-16 w-16 rounded-full bg-white" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
