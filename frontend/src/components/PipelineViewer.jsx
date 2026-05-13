import { ChevronDown } from "lucide-react";
import { useState } from "react";

function JsonPanel({ title, data, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const text = JSON.stringify(data ?? {}, null, 2);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left text-sm font-semibold text-slate-800"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <pre className="text-xs leading-relaxed p-4 overflow-x-auto bg-slate-900 text-emerald-100 max-h-72 overflow-y-auto">
          {text}
        </pre>
      )}
    </div>
  );
}

export default function PipelineViewer({ runResult }) {
  if (!runResult) {
    return (
      <section
        id="pipeline"
        className="rounded-2xl bg-white shadow-card border border-slate-200/60 p-6 mb-6"
      >
        <h2 className="font-display font-semibold text-lg text-slate-900 mb-2">
          Pipeline viewer
        </h2>
        <p className="text-sm text-slate-500">
          Run a command to see parsed JSON, generated rule, and final rule.
        </p>
      </section>
    );
  }

  const { parsed, generated_rule, final_rule } = runResult;

  return (
    <section
      id="pipeline"
      className="rounded-2xl bg-white shadow-card border border-slate-200/60 p-6 mb-6"
    >
      <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">
        Pipeline viewer
      </h2>
      <div className="space-y-3">
        <JsonPanel title="Parsed JSON" data={parsed} defaultOpen />
        <JsonPanel title="Generated rule JSON" data={generated_rule} defaultOpen={false} />
        <JsonPanel title="Final rule JSON" data={final_rule} defaultOpen={false} />
      </div>
    </section>
  );
}
