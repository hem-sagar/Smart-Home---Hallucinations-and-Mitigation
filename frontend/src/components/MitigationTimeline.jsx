import { GitBranch } from "lucide-react";

export default function MitigationTimeline({ runResult }) {
  const steps = runResult?.mitigation_timeline;

  return (
    <section
      id="mitigation"
      className="rounded-2xl bg-white shadow-card border border-slate-200/60 p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-5 w-5 text-indigo-600" />
        <h2 className="font-display font-semibold text-lg text-slate-900">
          Mitigation timeline
        </h2>
      </div>
      {!steps?.length ? (
        <p className="text-sm text-slate-500">
          Run a command to see validation and mitigation steps for that run.
        </p>
      ) : (
        <ol className="relative border-l-2 border-indigo-100 ml-2 space-y-4 pl-6">
          {steps.map((step, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.4rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-4 ring-white">
                {i + 1}
              </span>
              <p className="text-sm text-slate-700 leading-snug">{step}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
