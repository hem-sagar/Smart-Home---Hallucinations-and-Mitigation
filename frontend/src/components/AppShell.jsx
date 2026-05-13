import {
  LayoutDashboard,
  Terminal,
  Activity,
  ScrollText,
  Cpu,
  ShieldAlert,
  BarChart3,
} from "lucide-react";

const NAV = [
  { id: "command", label: "Command", icon: Terminal },
  { id: "status", label: "Home Status", icon: LayoutDashboard },
  { id: "sensors", label: "Sensors", icon: Cpu },
  { id: "pipeline", label: "Pipeline", icon: Activity },
  { id: "mitigation", label: "Mitigation", icon: ShieldAlert },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "logs", label: "Logs", icon: ScrollText },
];

export default function AppShell({ children, activeId, onNavigate }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-white/80 backdrop-blur-md lg:min-h-screen sticky top-0 z-20 shadow-soft lg:shadow-none">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-display font-semibold text-lg">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm shadow-md">
              SH
            </span>
            Dashboard
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-snug">
            Hallucination-aware control
          </p>
        </div>
        <nav className="flex lg:flex-col gap-1 p-3 overflow-x-auto lg:overflow-visible">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeId === id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
