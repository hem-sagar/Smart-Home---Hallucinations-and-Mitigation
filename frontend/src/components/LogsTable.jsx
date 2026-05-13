export default function LogsTable({ commandLogs, executionLogs }) {
  return (
    <section
      id="logs"
      className="rounded-2xl bg-white shadow-card border border-slate-200/60 p-6 mb-6"
    >
      <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">
        Logs
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
            Command logs
          </h3>
          <div className="rounded-xl border border-slate-100 overflow-hidden max-h-72 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Command</th>
                  <th className="px-3 py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {(commandLogs || []).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {row.timestamp}
                    </td>
                    <td className="px-3 py-2 text-slate-800 max-w-[180px] truncate">
                      {row.command}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {row.parsed_type || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
            Execution logs
          </h3>
          <div className="rounded-xl border border-slate-100 overflow-hidden max-h-72 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Rule</th>
                  <th className="px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {(executionLogs || []).map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {row.timestamp}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-700">
                      {row.rule_id}
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">
                      {row.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
