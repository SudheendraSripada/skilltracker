"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";

export type AIModel = "mistral-small-latest" | "mistral-large-latest" | "gpt-4o" | "claude-3-5-sonnet";

interface ModelSwitcherProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const MODELS: { id: AIModel; name: string; badge?: string }[] = [
  { id: "mistral-small-latest", name: "Mistral Small (Fast)" },
  { id: "mistral-large-latest", name: "Mistral Large (Reasoning)", badge: "Smart" },
  { id: "gpt-4o", name: "GPT-4 Omni (Smartest)", badge: "Best" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet (Creative)", badge: "Creative" },
];

export function ModelSwitcher({ selectedModel, onModelChange }: ModelSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
      >
        <Sparkles className="h-3 w-3 text-emerald-400" />
        {currentModel.name}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-xl">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => { setIsOpen(false); onModelChange(model.id); }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedModel === model.id ? "bg-slate-800 font-semibold text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span>{model.name}</span>
              {model.badge && (
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] uppercase font-bold text-emerald-400">
                  {model.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
