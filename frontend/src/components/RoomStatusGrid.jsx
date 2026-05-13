const DEVICE_EMOJI = {
  light: "💡",
  ac: "❄️",
  fan: "🌀",
  heater: "🔥",
  tv: "📺",
  door: "🚪",
  door_lock: "🔒",
  window: "🪟",
  alarm: "🚨",
  smoke_alarm: "🚨",
  gas_sensor: "⛽",
  exhaust_fan: "🌀",
  camera: "📷",
};

function formatRoomTitle(id) {
  return id
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function deviceEmoji(device) {
  return DEVICE_EMOJI[device] || "⚙️";
}

const ROOM_ORDER = [
  "living_room",
  "bedroom_1",
  "bedroom_2",
  "kitchen",
  "washroom",
  "garage",
];

export default function RoomStatusGrid({ currentDeviceStatus }) {
  const cards = ROOM_ORDER.filter((id) => currentDeviceStatus?.[id]);

  return (
    <section
      id="status"
      className="rounded-2xl bg-white shadow-card border border-slate-200/60 p-6 mb-6"
    >
      <h2 className="font-display font-semibold text-lg text-slate-900 mb-1">
        Smart home status
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Per-room devices update after each successful execution.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((roomId) => {
          const block = currentDeviceStatus[roomId];
          const devices = block?.devices || [];
          return (
            <div
              key={roomId}
              className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white p-4 shadow-soft hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <span className="text-xl" aria-hidden>
                  🏠
                </span>
                <h3 className="font-display font-semibold text-slate-900">
                  {formatRoomTitle(roomId)}
                </h3>
              </div>
              <ul className="space-y-1.5 text-sm">
                {devices.map(({ device, status }) => (
                  <li
                    key={`${roomId}-${device}`}
                    className="flex justify-between gap-2 text-slate-700"
                  >
                    <span>
                      {deviceEmoji(device)}{" "}
                      <span className="font-medium capitalize">
                        {device.replace(/_/g, " ")}
                      </span>
                      :
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${
                        status === "ON" || String(status).startsWith("ON")
                          ? "text-emerald-600"
                          : status === "OFF" || status === "CLOSED"
                            ? "text-slate-400"
                            : "text-blue-600"
                      }`}
                    >
                      {status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
