"use client";

import { CheckCircle2, Sparkles, X } from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-white">
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-6 w-6 text-emerald-400" />
          <span>Upgrade to Pro</span>
        </div>
        
        <p className="mt-2 text-sm text-slate-400">
          You've reached the free tier limit. Upgrade now to unlock advanced AI capabilities and unlimited file storage.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-inner">
            <div className="text-3xl font-bold text-white">
              $25.00<span className="text-sm font-normal text-slate-400">/mo</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 uppercase tracking-wider font-semibold">Billed monthly</p>
          </div>
          
          <ul className="space-y-3 px-1">
            {[
              "Unlimited Document Uploads",
              "Access to GPT-4o & Claude 3.5 Sonnet",
              "Unlimited Tailored AI Quizzes",
              "Advanced Analytics & Daily Streaks",
              "Priority Customer Support"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition"
          >
            Maybe Later
          </button>
          <button 
            onClick={() => {
              alert("Payment integration is mocked. Enjoy Pro features!");
              onClose();
            }}
            className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition transform active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
