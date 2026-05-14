import { useEffect, useState } from "react";
import { Play, Loader2, AlertCircle, Cpu } from "lucide-react";
import { runCommand } from "../api";

const PIPELINE_LABELS = [
  "Parser (LLM)",
  "Rule generator",
  "Hallucination check",
  "Mitigation (if needed)",
  "Execution",
];

/** Human-readable mitigation changes for the compact pipeline hint */
function mitigationAdjustmentsHint(runResult) {
  const fallback = "Adjusted rooms, devices, or conditions";
  const steps = runResult?.mitigation_timeline;
  if (!Array.isArray(steps) || steps.length === 0) return fallback;

  const skip = (s) =>
    /^Hallucination detected:/i.test(s) ||
    /^Rule executed$/i.test(s) ||
    /^Command rejected$/i.test(s) ||
    /^Mitigation could not fully repair/i.test(s);

  const kept = steps.filter((s) => typeof s === "string" && s.trim() && !skip(s));
  if (kept.length === 0) return fallback;

  const text = kept.join(" · ");
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

function resultBadge(runResult) {
  if (!runResult) return null;
  const { final_status, hallucination_detected, mitigation_status } =
    runResult;
  if (final_status === "executed") {
    if (
      hallucination_detected &&
      mitigation_status === "mitigated_successfully"
    ) {
      return {
        label: "Mitigated",
        emoji: "⚠️",
        className: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
    return {
      label: "Executed",
      emoji: "✅",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  }
  return {
    label: "Wrong Command",
    emoji: "❌",
    className: "bg-rose-50 text-rose-800 border-rose-200",
  };
}

/** Compact lines for the right-hand status box after the API returns */
function buildCompletedSteps(runResult) {
  if (!runResult) return [];
  const p = runResult.parsed || {};
  const ptype = (p.type || "").toLowerCase();

  const steps = [
    {
      key: "parse",
      label: "Parser",
      hint: ptype ? `type: ${ptype}` : "done",
      tone: "ok",
    },
  ];

  if (ptype === "unknown") {
    steps.push({
      key: "stop",
      label: "Stopped",
      hint: "Not a smart-home command",
      tone: "warn",
    });
    return steps;
  }

  if (ptype === "preference") {
    steps.push({
      key: "pref",
      label: "Personalization",
      hint: "Preference saved",
      tone: "ok",
    });
    return steps;
  }

  const ruleId = runResult.generated_rule?.rule_id;
  steps.push({
    key: "rule",
    label: "Rule",
    hint: ruleId ? ruleId : "generated",
    tone: "ok",
  });

  const hall = runResult.hallucination_detected;
  steps.push({
    key: "check",
    label: "Validation",
    hint: hall ? "Issues found" : "Rule looks valid",
    tone: hall ? "warn" : "ok",
  });

  const ms = runResult.mitigation_status || "";
  if (ms === "not_required") {
    steps.push({
      key: "mit",
      label: "Mitigation",
      hint: "Not needed",
      tone: "ok",
    });
  } else if (ms === "mitigated_successfully") {
    steps.push({
      key: "mit",
      label: "Mitigation",
      hint: mitigationAdjustmentsHint(runResult),
      tone: "ok",
    });
  } else if (ms === "mitigation_failed") {
    steps.push({
      key: "mit",
      label: "Mitigation",
      hint: "Could not repair",
      tone: "err",
    });
  } else if (ms && ms !== "error") {
    steps.push({
      key: "mit",
      label: "Mitigation",
      hint: ms.replace(/_/g, " "),
      tone: "warn",
    });
  } else if (ms === "error") {
    steps.push({
      key: "mit",
      label: "Mitigation",
      hint: "Error",
      tone: "err",
    });
  }

  const done = runResult.final_status === "executed";
  steps.push({
    key: "exec",
    label: "Execution",
    hint: done ? "Simulated run logged" : "Skipped",
    tone: done ? "ok" : "err",
  });

  return steps;
}

function toneDot(tone) {
  if (tone === "ok") return "bg-emerald-500";
  if (tone === "warn") return "bg-amber-500";
  if (tone === "err") return "bg-rose-500";
  return "bg-slate-300";
}

function PipelineMiniBox({ loading, pulseIndex, runResult, error }) {
  const showPlaceholder = !loading && !runResult && !error;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-4 shadow-soft h-fit">
      <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-3">
        <Cpu className="h-4 w-4 text-indigo-600 shrink-0" />
        Live pipeline
      </div>

      {showPlaceholder && (
        <p className="text-xs text-slate-500 leading-relaxed">
          Run a command to see each stage update here while the backend works.
        </p>
      )}

      {loading && (
        <ul className="space-y-2">
          {PIPELINE_LABELS.map((label, i) => {
            const active = i === pulseIndex;
            const past = i < pulseIndex;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-100"
                    : past
                      ? "text-slate-500"
                      : "text-slate-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    active
                      ? "bg-indigo-500 animate-pulse"
                      : past
                        ? "bg-slate-300"
                        : "bg-slate-200"
                  }`}
                />
                <span className={active ? "font-semibold" : ""}>{label}</span>
                {active && (
                  <Loader2 className="h-3 w-3 animate-spin ml-auto text-indigo-600" />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!loading && error && !runResult && (
        <p className="text-xs text-rose-700 leading-snug rounded-lg bg-rose-50 border border-rose-100 px-2 py-2">
          <span className="font-semibold">Request failed.</span>{" "}
          <span className="opacity-90 break-words">{error}</span>
        </p>
      )}

      {!loading && runResult && (
        <ul className="space-y-2">
          {buildCompletedSteps(runResult).map((s) => (
            <li
              key={s.key}
              className="flex gap-2 text-xs text-slate-700 leading-snug"
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${toneDot(s.tone)}`}
              />
              <div>
                <span className="font-semibold text-slate-800">{s.label}</span>
                <span className="text-slate-500"> — {s.hint}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CommandPanel({
  userId,
  setUserId,
  onDashboardRefresh,
  runResult,
  setRunResult,
}) {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRunCommand, setLastRunCommand] = useState("");
  const [pulseIndex, setPulseIndex] = useState(0);

  const badge = resultBadge(runResult);

  useEffect(() => {
    if (!loading) return;
    setPulseIndex(0);
    const id = setInterval(() => {
      setPulseIndex((i) => (i >= PIPELINE_LABELS.length - 1 ? i : i + 1));
    }, 520);
    return () => clearInterval(id);
  }, [loading]);

  async function handleRun(e) {
    e.preventDefault();
    const text = command.trim();
    if (!text) return;

    setError("");
    setLastRunCommand(text);
    setCommand("");
    setLoading(true);
    setRunResult(null);

    try {
      const res = await runCommand(userId, text);
      setRunResult(res);
      await onDashboardRefresh();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const showLastRun = Boolean(lastRunCommand || loading);

  return (
    <section
      id="command"
      className="rounded-2xl bg-white shadow-card border border-slate-200/60 p-6 mb-6"
    >
      <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">
        Command panel
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(220px,280px)] gap-6 lg:items-start">
        <div className="min-w-0">
          <form onSubmit={handleRun} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="sm:w-44">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  User
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="father">father</option>
                  <option value="mother">mother</option>
                  <option value="son">son</option>
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Natural language command
                </label>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder='e.g. turn on ac if temp is 100c'
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !command.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm px-5 py-2.5 shadow-md hover:opacity-95 disabled:opacity-60 transition-opacity"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run
              </button>
            </div>
          </form>

          {showLastRun && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                {loading ? "Running" : "Last command"}
              </p>
              <div className="flex flex-wrap items-center gap-2 gap-y-1">
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" />
                )}
                <p className="text-sm text-slate-900 font-medium break-all flex-1 min-w-0">
                  &ldquo;{lastRunCommand}&rdquo;
                </p>
                {loading && (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 shrink-0">
                    Executing…
                  </span>
                )}
                {!loading && badge && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0 ${badge.className}`}
                  >
                    <span>{badge.emoji}</span>
                    {badge.label}
                  </span>
                )}
              </div>
              {!loading && runResult?.hallucination_message && (
                <p className="mt-2 text-xs text-slate-600 leading-snug border-t border-slate-200/80 pt-2">
                  {runResult.final_status === "executed" &&
                  runResult.hallucination_detected ? (
                    <>
                      <span className="font-semibold text-slate-700">
                        Initial validation (before fixes):{" "}
                      </span>
                      {runResult.hallucination_message}
                    </>
                  ) : (
                    runResult.hallucination_message
                  )}
                </p>
              )}
              {!loading &&
                runResult?.final_status === "executed" &&
                Array.isArray(runResult.execution_results) &&
                runResult.execution_results.length > 0 && (
                  <div className="mt-2 border-t border-slate-200/80 pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      Executed command (simulated)
                    </p>
                    <ul className="text-xs text-slate-800 space-y-1 list-disc list-inside">
                      {runResult.execution_results.map((line, i) => (
                        <li key={i} className="leading-snug">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm p-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="break-all">{error}</span>
            </div>
          )}
        </div>

        <PipelineMiniBox
          loading={loading}
          pulseIndex={pulseIndex}
          runResult={loading ? null : runResult}
          error={error}
        />
      </div>
    </section>
  );
}
