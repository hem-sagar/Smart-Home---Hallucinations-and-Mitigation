import { useCallback, useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { fetchDashboardData } from "./api.js";
import AppShell from "./components/AppShell.jsx";
import Header from "./components/Header.jsx";
import StatsStrip from "./components/StatsStrip.jsx";
import CommandPanel from "./components/CommandPanel.jsx";
import RoomStatusGrid from "./components/RoomStatusGrid.jsx";
import SensorMappingSection from "./components/SensorMappingSection.jsx";
import PipelineViewer from "./components/PipelineViewer.jsx";
import MitigationTimeline from "./components/MitigationTimeline.jsx";
import AnalyticsSection from "./components/AnalyticsSection.jsx";
import LogsTable from "./components/LogsTable.jsx";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export default function App() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [userId, setUserId] = useState("father");
  const [runResult, setRunResult] = useState(null);
  const [activeNav, setActiveNav] = useState("command");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError("");
    setBusy(true);
    try {
      const d = await fetchDashboardData();
      setData(d);
    } catch (e) {
      setLoadError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function navigate(id) {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppShell activeId={activeNav} onNavigate={navigate}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={() => load()}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          Refresh data
        </button>
      </div>

      <Header />

      {loadError && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Could not load dashboard</p>
            <p className="mt-1 opacity-90 break-all">{loadError}</p>
            <p className="mt-2 text-xs text-amber-800/80">
              Start the API from the repo root:{" "}
              <code className="rounded bg-amber-100/80 px-1">
                uvicorn backend.main:app --reload
              </code>{" "}
              (expects{" "}
              <code className="rounded bg-amber-100/80 px-1">{API_BASE}</code>).
            </p>
          </div>
        </div>
      )}

      {data && <StatsStrip counters={data.counters} />}

      <CommandPanel
        userId={userId}
        setUserId={setUserId}
        onDashboardRefresh={load}
        runResult={runResult}
        setRunResult={setRunResult}
      />

      <RoomStatusGrid currentDeviceStatus={data?.current_device_status} />

      <SensorMappingSection mappings={data?.sensor_to_device_mappings} />

      <PipelineViewer runResult={runResult} />

      <MitigationTimeline runResult={runResult} />

      <AnalyticsSection graphData={data?.graph_data} />

      <LogsTable
        commandLogs={data?.command_logs_preview}
        executionLogs={data?.execution_logs_preview}
      />
    </AppShell>
  );
}
