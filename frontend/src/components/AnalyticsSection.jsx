import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function ChartCard({ title, data, fill }) {
  const chartData = data?.length ? data : [{ name: "No data", count: 0 }];

  return (
    <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/50 p-4 shadow-soft">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748b" }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={70}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" fill={fill} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AnalyticsSection({ graphData }) {
  const g = graphData || {};

  return (
    <section
      id="analytics"
      className="rounded-2xl bg-white shadow-card border border-slate-200/60 p-6 mb-6"
    >
      <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">
        Analytics
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Command status counts"
          data={g.command_status_counts}
          fill="#3b82f6"
        />
        <ChartCard
          title="Hallucination / mitigation categories"
          data={g.hallucination_types}
          fill="#f59e0b"
        />
        <ChartCard
          title="Device action counts"
          data={g.device_action_counts}
          fill="#10b981"
        />
      </div>
    </section>
  );
}
