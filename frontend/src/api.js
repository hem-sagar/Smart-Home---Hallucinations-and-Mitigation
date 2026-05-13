const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export async function fetchDashboardData() {
  const res = await fetch(`${API_BASE}/dashboard-data`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function runCommand(userId, command) {
  const res = await fetch(`${API_BASE}/run-command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, command }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}
