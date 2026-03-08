"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Loader2, Send, Keyboard, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VoiceButtonProps {
  language: "hi-IN" | "en-IN";
  privateMode: boolean;
  onTransactionSuccess: (details: any) => void;
  onLessonGenerated: (lessonText: string) => void;
  compact?: boolean;
}

export default function VoiceButton({
  language,
  privateMode,
  onTransactionSuccess,
  onLessonGenerated,
  compact,
}: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textQuery, setTextQuery] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = (e: any) => {
          const query = e.results[0][0].transcript;
          processQuery(query);
        };
        recognition.onerror = (e: any) => {
          console.error("Speech error:", e.error);
          setIsListening(false);
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            setShowTextInput(true);
          }
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      } else {
        setShowTextInput(true);
      }
    }
  }, [language]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListening || isProcessing) return;
    speak(language === "hi-IN" ? "बोलिए" : "Go ahead");
    setIsListening(true);
    try {
      if (recognitionRef.current) {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
      }
    } catch {
      setShowTextInput(true);
      setIsListening(false);
    }
  };

  const processQuery = async (query: string) => {
    if (!query.trim()) return;
    setIsProcessing(true);
    try {
      const systemPrompt = `You are BolLedger AI, a shop assistant for Indian kirana stores. 
Your task is to parse a voice transaction.
Return ONLY a raw JSON object (no markdown, no other text) with:
{
  "spokenResponse": "A short, warm 1-sentence confirmation in ${language === 'hi-IN' ? 'Hindi' : 'English'}",
  "productName": "Item name",
  "price": number,
  "lessonText": "A 1-sentence business insight based on this transaction"
}
Privacy: NEVER mention total revenue or profit margins in 'spokenResponse'.
Language: ${language === 'hi-IN' ? 'Hindi' : 'English'}.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: query,
          systemPrompt: systemPrompt,
        }),
      });

      const data = await response.json();
      const rawReply = data.reply || "";
      
      // Robust JSON extraction from LLM response
      let parsed = {
        spokenResponse: language === "hi-IN" ? "बिक्री दर्ज हो गई!" : "Sale recorded!",
        productName: query,
        price: 0,
        lessonText: language === "hi-IN" ? "अपना व्यापार बढ़ाते रहें!" : "Keep growing your business!"
      };

      try {
        const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          parsed = { ...parsed, ...extracted };
        }
      } catch (e) {
        console.warn("Failed to parse AI JSON response, using fallback.");
      }

      speak(parsed.spokenResponse);
      onTransactionSuccess({ productName: parsed.productName, price: parsed.price });
      onLessonGenerated(parsed.lessonText);

      setTextQuery("");
      setShowTextInput(false);
    } catch (err) {
      console.error("Voice AI Error:", err);
      speak(
        language === "hi-IN"
          ? "माफ कीजिये, कुछ गड़बड़ हो गई।"
          : "Sorry, an error occurred."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processQuery(textQuery);
  };

  if (showTextInput) {
    return (
      <div className="fixed inset-x-0 bottom-24 px-4 z-[70] animate-in slide-in-from-bottom-4">
        <div className="bg-white border border-slate-200 p-4 rounded-[24px] shadow-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-[#C45000] uppercase tracking-[0.2em]">
              {language === "hi-IN" ? "लिख कर बताएं" : "Type Command"}
            </h3>
            <button
              onClick={() => setShowTextInput(false)}
              className="text-slate-400 p-2"
            >
              <X size={20} />
            </button>
          </div>
          <Input
            value={textQuery}
            onChange={(e) => setTextQuery(e.target.value)}
            placeholder={
              language === "hi-IN"
                ? "जैसे: 5 किलो आटा बेचा..."
                : "e.g. Sold 5kg flour..."
            }
            className="h-16 text-sm border-slate-100 rounded-2xl bg-slate-50"
            autoFocus
          />
          <Button
            onClick={handleTextSubmit}
            disabled={isProcessing || !textQuery.trim()}
            className="w-full h-16 rounded-2xl bg-[#C45000] text-white font-bold"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Send size={20} className="mr-2" />
                {language === "hi-IN" ? "भेजें" : "Send"}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4">
        <button
          onClick={startListening}
          disabled={isProcessing}
          className={cn(
            "h-20 w-20 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(196,80,0,0.3)] transition-all active:scale-90 border-4 border-white",
            isListening ? "bg-red-500 animate-pulse" : "bg-[#C45000]",
            isProcessing && "bg-slate-400 cursor-wait"
          )}
        >
          {isProcessing ? (
            <Loader2 className="text-white animate-spin" size={32} />
          ) : (
            <Mic className="text-white" size={32} />
          )}
        </button>

        <button
          onClick={() => setShowTextInput(true)}
          className="h-12 w-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm hover:text-[#C45000] transition-colors"
        >
          <Keyboard size={20} />
        </button>
      </div>

      <p className="mt-2 text-[10px] font-black text-[#C45000] uppercase tracking-tighter">
        {isListening
          ? language === "hi-IN"
            ? "सुन रहा हूँ..."
            : "Listening..."
          : language === "hi-IN"
          ? "बोलिए"
          : "Tap to Speak"}
      </p>
    </div>
  );
}
