import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="mb-8 rounded-2xl bg-white/90 backdrop-blur shadow-card border border-slate-200/60 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 mb-3 border border-blue-100">
            <Sparkles className="h-3.5 w-3.5" />
            LLM pipeline + validation
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
           Enhancing Reliability in LLM-Based Smart Home Systems
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
            Multi-user personalized LLM smart-home automation with rule
            generation, hallucination checks, mitigation, and simulated
            execution.
          </p>
        </div>
      </div>
    </header>
  );
}
