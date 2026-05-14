function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/90 px-4 py-3 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-display font-bold text-slate-900 tabular-nums">
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function StatsStrip({ counters }) {
  const c = counters || {};
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
      <Stat label="Total commands" value={c.total_commands} />
      <Stat label="Valid / executed" value={c.valid_commands} />
      <Stat label="Hallucinations (logs)" value={c.hallucinations_detected} />
      <Stat label="Mitigations" value={c.mitigations_successful} />
      {/* <Stat label="Rejected" value={c.rejected_commands} /> */}
    </div>
  );
}
