"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";

type FeedbackType = "bug" | "feature_request" | "general";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pathname = usePathname();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          route: pathname,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setMessage("");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full bg-emerald-500 text-slate-950 shadow-lg hover:bg-emerald-400 hover:scale-105 transition-all duration-200"
        >
          <MessageSquarePlus className="h-6 w-6" />
          <span className="sr-only">Open Feedback</span>
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Send Feedback</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-emerald-500/20 p-3 text-emerald-400">
                  <MessageSquarePlus className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-medium text-slate-100">Thanks for your feedback!</h4>
                <p className="mt-2 text-sm text-slate-400">
                  We appreciate your help in making Skill Tracker better.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("general")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs transition-colors ${
                      type === "general"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    General
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("feature_request")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs transition-colors ${
                      type === "feature_request"
                        ? "border-sky-500 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <Lightbulb className="h-5 w-5" />
                    Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("bug")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs transition-colors ${
                      type === "bug"
                        ? "border-rose-500 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <Bug className="h-5 w-5" />
                    Bug Report
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === "bug"
                        ? "What went wrong?"
                        : type === "feature_request"
                        ? "What would you like to see?"
                        : "Tell us what's on your mind..."
                    }
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                {error && <p className="text-xs text-rose-400">{error}</p>}

                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Submit Feedback"}
                </Button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
