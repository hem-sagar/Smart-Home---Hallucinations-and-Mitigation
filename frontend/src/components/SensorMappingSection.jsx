export default function SensorMappingSection({ mappings }) {
  const rows = mappings?.length
    ? mappings
    : [
        {
          sensor_label: "🌡️ temperature",
          targets: "❄️ ac / 🔥 heater / 🌀 fan",
          meaning: "controls room temperature",
        },
        {
          sensor_label: "💧 humidity",
          targets: "🌀 fan / ventilation",
          meaning: "controls humidity / airflow",
        },
        {
          sensor_label: "👣 presence",
          targets: "💡 light / 📷 camera",
          meaning: "detects people / motion",
        },
        {
          sensor_label: "🔥 smoke_alarm",
          targets: "🚨 alarm / ventilation",
          meaning: "safety alert",
        },
        {
          sensor_label: "💡 light_level",
          targets: "💡 light",
          meaning: "controls brightness",
        },
      ];

  return (
    <section
      id="sensors"
      className="rounded-2xl bg-white shadow-card border border-slate-200/60 p-6 mb-6"
    >
      <h2 className="font-display font-semibold text-lg text-slate-900 mb-1">
        Sensor → device mapping
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        How environmental inputs map to actuators (from{" "}
        <code className="text-xs bg-slate-100 px-1 rounded">data/sensors.csv</code>
        ).
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 font-semibold">Sensor</th>
              <th className="px-4 py-3 font-semibold">Outputs</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell">
                Meaning
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.sensor || i}
                className="border-t border-slate-100 hover:bg-slate-50/50"
              >
                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                  {row.sensor_label || row.sensor}
                </td>
                <td className="px-4 py-3 text-slate-700">{row.targets}</td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell max-w-md">
                  {row.meaning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
