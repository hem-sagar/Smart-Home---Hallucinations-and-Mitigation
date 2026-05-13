"""
FastAPI backend for the hallucination-aware smart home dashboard.
Run from repo root: uvicorn backend.main:app --reload
"""

from __future__ import annotations

import csv
import json
import os
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
os.chdir(ROOT)

from module1_parser import run_module1
from module2_rule_generator import run_module2
from module3_hallucination_checker import check_hallucination
from module4_mitigation import mitigate_rule
from module5_execution import run_execution

ALLOWED_USERS = {"father", "mother", "son"}


def _read_csv_rows(path: str) -> list[dict[str, str]]:
    if not os.path.isfile(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _read_json_file(path: str) -> Any:
    if not os.path.isfile(path):
        return []
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _load_rooms_devices_sensors() -> tuple[list[str], list[dict], list[dict]]:
    rooms_rows = _read_csv_rows("data/rooms.csv")
    rooms = [r["room"] for r in rooms_rows if r.get("room")]
    devices = _read_csv_rows("data/devices.csv")
    devices = [d for d in devices if d.get("room") and d.get("device")]
    sensors = _read_csv_rows("data/sensors.csv")
    return rooms, devices, sensors


def _sensor_to_device_mappings(sensors: list[dict]) -> list[dict[str, Any]]:
    out = []
    emoji = {
        "temperature": "🌡️",
        "humidity": "💧",
        "presence": "👣",
        "motion": "🏃",
        "smoke_alarm": "🔥",
        "gas_sensor": "⛽",
        "light_level": "💡",
        "door_status": "🚪",
    }
    dev_emoji = {
        "ac": "❄️",
        "heater": "🔥",
        "fan": "🌀",
        "exhaust_fan": "🌀",
        "light": "💡",
        "camera": "📷",
        "smoke_alarm": "🚨",
        "gas_sensor": "🚨",
        "door": "🚪",
    }
    for s in sensors:
        sensor = s.get("sensor", "")
        related = s.get("related_devices", "") or ""
        parts = [p.strip() for p in related.split(";") if p.strip()]
        mapped = " / ".join(f"{dev_emoji.get(p, '⚙️')} {p.replace('_', ' ')}" for p in parts)
        meaning = s.get("meaning", "")
        out.append(
            {
                "sensor": sensor,
                "sensor_label": f"{emoji.get(sensor, '📟')} {sensor.replace('_', ' ')}",
                "targets": mapped or "—",
                "meaning": meaning,
            }
        )
    return out


def _default_device_state(
    rooms: list[str], devices: list[dict[str, str]]
) -> dict[str, dict[str, str]]:
    state: dict[str, dict[str, str]] = {r: {} for r in rooms}
    for d in devices:
        room, dev = d["room"], d["device"]
        if room not in state:
            state[room] = {}
        if dev not in state[room]:
            state[room][dev] = _default_status_for_device(dev)
    return state


def _default_status_for_device(device: str) -> str:
    if device in ("door",):
        return "CLOSED"
    if device in ("smoke_alarm", "gas_sensor", "camera"):
        return "OFF"
    return "OFF"


def _status_from_action(action: str, value: Any) -> str | None:
    a = (action or "").strip().lower()
    if a == "turn_on":
        return "ON"
    if a == "turn_off":
        return "OFF"
    if a == "open":
        return "OPEN"
    if a == "close":
        return "CLOSED"
    if a == "lock":
        return "LOCKED"
    if a == "unlock":
        return "UNLOCKED"
    if a == "set_temperature" and value not in (None, "", "null"):
        return f"ON ({value}°)"
    if a == "set_speed" and value not in (None, "", "null"):
        return f"ON (speed {value})"
    if a == "set_volume" and value not in (None, "", "null"):
        return f"ON (vol {value})"
    if a == "set_channel" and value not in (None, "", "null"):
        return f"ON (ch {value})"
    if a == "trigger":
        return "TRIGGERED"
    if a == "reset":
        return "OFF"
    if a == "read":
        return "READ"
    return None


def _rooms_with_device(
    device: str, catalog: dict[str, set[str]]
) -> list[str]:
    return [r for r, devs in catalog.items() if device in devs]


def _apply_rule_to_state(
    state: dict[str, dict[str, str]],
    rule: dict[str, Any],
    room_device_catalog: dict[str, set[str]],
) -> None:
    for act in rule.get("actions") or []:
        room = act.get("room")
        device = act.get("device")
        action = act.get("action")
        value = act.get("value")
        label = _status_from_action(action, value)
        if not label or not device:
            continue
        targets: list[str] = []
        if room == "all":
            targets = _rooms_with_device(device, room_device_catalog)
        elif room in state:
            targets = [room]
        for r in targets:
            if r in state and device in state[r]:
                state[r][device] = label


def _build_room_device_catalog(devices: list[dict]) -> dict[str, set[str]]:
    cat: dict[str, set[str]] = {}
    for d in devices:
        r, dev = d.get("room"), d.get("device")
        if not r or not dev:
            continue
        cat.setdefault(r, set()).add(dev)
    return cat


def _replay_execution_logs_into_state(
    state: dict[str, dict[str, str]],
    room_device_catalog: dict[str, set[str]],
) -> None:
    rows = _read_csv_rows("logs/execution_logs.csv")
    for row in rows:
        raw = row.get("rule_json") or ""
        if not raw.strip():
            continue
        try:
            rule = json.loads(raw)
        except json.JSONDecodeError:
            continue
        _apply_rule_to_state(state, rule, room_device_catalog)


def _parse_command_log_row(row: dict[str, str]) -> dict[str, Any] | None:
    if "parsed_output" in row and row.get("parsed_output"):
        try:
            return json.loads(row["parsed_output"])
        except json.JSONDecodeError:
            return None
    return None


def _mitigation_reason_bucket(reason: str) -> str:
    r = (reason or "").lower()
    if "room" in r or "selected" in r:
        return "Room inference / fix"
    if "sensor" in r or "mapped" in r:
        return "Sensor → device mapping"
    if "clamp" in r or "normalized" in r or "operator" in r:
        return "Condition normalization"
    if "moved device" in r:
        return "Device room correction"
    return "Other mitigation"


def _count_device_actions_from_executions() -> Counter[str]:
    c: Counter[str] = Counter()
    for row in _read_csv_rows("logs/execution_logs.csv"):
        raw = row.get("rule_json") or ""
        if not raw.strip():
            continue
        try:
            rule = json.loads(raw)
        except json.JSONDecodeError:
            continue
        for a in rule.get("actions") or []:
            dev = a.get("device") or "?"
            act = a.get("action") or "?"
            c[f"{dev}:{act}"] += 1
    return c


def _read_command_log_rows_flexible() -> list[dict[str, str]]:
    """Support legacy CSV headers plus module1 rows: timestamp, command, parsed_output."""
    path = "logs/command_logs.csv"
    if not os.path.isfile(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        first = f.readline()
    if not first:
        return []
    if "parsed_output" in first.lower():
        return _command_log_rows_normalized()

    rows_out: list[dict[str, str]] = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)
        for parts in reader:
            if len(parts) == 3:
                ts, cmd, raw_json = parts[0], parts[1], parts[2]
                try:
                    json.loads(raw_json)
                except json.JSONDecodeError:
                    continue
                rows_out.append(
                    {"timestamp": ts, "command": cmd, "parsed_output": raw_json}
                )
    return rows_out


def _command_log_rows_normalized() -> list[dict[str, str]]:
    path = "logs/command_logs.csv"
    if not os.path.isfile(path):
        return []
    rows = _read_csv_rows(path)
    out = []
    for row in rows:
        if "command" in row and "parsed_output" in row:
            out.append(row)
    return out


def _diff_rule_timeline(
    before: dict[str, Any], after: dict[str, Any]
) -> list[str]:
    steps: list[str] = []
    ba = before.get("actions") or []
    aa = after.get("actions") or []
    if len(ba) == len(aa):
        for i, (b, a) in enumerate(zip(ba, aa)):
            br, bd = b.get("room"), b.get("device")
            ar, ad = a.get("room"), a.get("device")
            if br in ("unknown", "", None) and ar not in ("unknown", "", None):
                steps.append(f"Room inferred as {ar}")
            if bd != ad and bd and ad:
                steps.append(f"Device corrected: {bd} → {ad}")
            if br != ar and br not in ("unknown", "", None) and ar:
                steps.append(f"Room adjusted: {br} → {ar}")
    cond_b = json.dumps(before.get("conditions") or [])
    cond_a = json.dumps(after.get("conditions") or [])
    if cond_b != cond_a and (before.get("conditions") or after.get("conditions")):
        steps.append("Condition normalized")
    if any("clamp" in s.lower() for s in steps):
        pass
    else:
        vb = json.dumps(before.get("conditions") or [])
        va = json.dumps(after.get("conditions") or [])
        if vb != va and ("50" in va or "50" in vb):
            steps.append("Sensor bounds / values adjusted")
    return steps


def _build_run_timeline(
    generated_rule: dict[str, Any],
    final_rule: dict[str, Any],
    first_valid: bool,
    hallucination_message: str,
    mitigation_status: str,
    final_status: str,
) -> list[str]:
    steps: list[str] = []
    if not first_valid and hallucination_message:
        steps.append(f"Hallucination detected: {hallucination_message}")
    if mitigation_status == "mitigated_successfully":
        steps.extend(_diff_rule_timeline(generated_rule, final_rule))
        if not any("inferred" in s.lower() or "room" in s.lower() for s in steps):
            if json.dumps(generated_rule) != json.dumps(final_rule):
                steps.insert(0, "Mitigation steps applied")
    if mitigation_status == "mitigation_failed":
        steps.append("Mitigation could not fully repair the rule")
    if final_status == "executed":
        steps.append("Rule executed")
    elif final_status == "rejected":
        steps.append("Command rejected")
    if not steps and final_status == "executed":
        steps.append("Rule validated and executed")
    return steps


# --- App state ---
ROOMS: list[str] = []
DEVICES: list[dict] = []
SENSORS: list[dict] = []
ROOM_DEVICE_CATALOG: dict[str, set[str]] = {}
DEVICE_STATE: dict[str, dict[str, str]] = {}


def refresh_static_catalog() -> None:
    global ROOMS, DEVICES, SENSORS, ROOM_DEVICE_CATALOG, DEVICE_STATE
    ROOMS, DEVICES, SENSORS = _load_rooms_devices_sensors()
    ROOM_DEVICE_CATALOG = _build_room_device_catalog(DEVICES)
    DEVICE_STATE = _default_device_state(ROOMS, DEVICES)
    _replay_execution_logs_into_state(DEVICE_STATE, ROOM_DEVICE_CATALOG)


refresh_static_catalog()

app = FastAPI(title="Smart Home Hallucination Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunCommandBody(BaseModel):
    user_id: str = Field(..., description="father | mother | son")
    command: str = Field(..., min_length=1)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/run-command")
def run_command(body: RunCommandBody) -> dict[str, Any]:
    uid = body.user_id.strip().lower()
    if uid not in ALLOWED_USERS:
        raise HTTPException(status_code=400, detail="user_id must be father, mother, or son")
    command = body.command.strip()
    if not command:
        raise HTTPException(status_code=400, detail="command is required")

    empty_rule: dict[str, Any] = {}
    base: dict[str, Any] = {
        "user_id": uid,
        "command": command,
        "parsed": {},
        "generated_rule": empty_rule,
        "hallucination_detected": False,
        "hallucination_message": "",
        "mitigation_status": "",
        "final_rule": empty_rule,
        "execution_results": [],
        "final_status": "rejected",
        "mitigation_timeline": [],
    }

    try:
        parsed = run_module1(uid, command)
    except Exception as e:
        base["hallucination_message"] = str(e)
        base["mitigation_status"] = "error"
        base["mitigation_timeline"] = [f"Pipeline error: {e}"]
        return base

    base["parsed"] = parsed
    ptype = (parsed.get("type") or "").lower()

    if ptype == "unknown":
        base["mitigation_status"] = "not_applicable"
        base["mitigation_timeline"] = ["Not a smart-home command", "Command rejected"]
        return base

    if ptype == "preference":
        base["mitigation_status"] = "preference_saved"
        base["final_status"] = "executed"
        base["mitigation_timeline"] = ["Personal preference saved"]
        return base

    try:
        generated_rule = run_module2(parsed)
    except Exception as e:
        base["hallucination_message"] = str(e)
        base["mitigation_status"] = "error"
        base["mitigation_timeline"] = [f"Rule generation error: {e}"]
        return base

    base["generated_rule"] = generated_rule
    first_valid, msg = check_hallucination(generated_rule)
    base["hallucination_detected"] = not first_valid
    base["hallucination_message"] = "" if first_valid else msg

    final_rule: dict[str, Any] = dict(generated_rule)
    mitigation_status = "not_required" if first_valid else ""

    if first_valid:
        mitigation_status = "not_required"
        results = run_execution(final_rule)
        base["final_rule"] = final_rule
        base["execution_results"] = results
        base["final_status"] = "executed"
        base["mitigation_status"] = mitigation_status
        base["mitigation_timeline"] = _build_run_timeline(
            generated_rule,
            final_rule,
            True,
            "",
            mitigation_status,
            "executed",
        )
        _apply_rule_to_state(DEVICE_STATE, final_rule, ROOM_DEVICE_CATALOG)
        return base

    fixed_rule, mit_status = mitigate_rule(generated_rule)
    base["mitigation_status"] = mit_status
    second_valid, msg2 = check_hallucination(fixed_rule)
    if not second_valid:
        base["hallucination_message"] = msg2 or base["hallucination_message"]
        base["final_rule"] = fixed_rule
        base["mitigation_timeline"] = _build_run_timeline(
            generated_rule,
            fixed_rule,
            False,
            base["hallucination_message"],
            mit_status,
            "rejected",
        )
        return base

    final_rule = fixed_rule
    base["final_rule"] = final_rule
    results = run_execution(final_rule)
    base["execution_results"] = results
    base["final_status"] = "executed"
    base["mitigation_timeline"] = _build_run_timeline(
        generated_rule,
        final_rule,
        False,
        msg,
        mit_status,
        "executed",
    )
    _apply_rule_to_state(DEVICE_STATE, final_rule, ROOM_DEVICE_CATALOG)
    return base


@app.get("/dashboard-data")
def dashboard_data() -> dict[str, Any]:
    refresh_static_catalog()
    rooms, devices, sensors = ROOMS, DEVICES, SENSORS
    mappings = _sensor_to_device_mappings(sensors)

    cmd_rows = _read_command_log_rows_flexible()
    total_commands = len(cmd_rows)
    ignored = 0
    for row in cmd_rows:
        p = _parse_command_log_row(row)
        if p and (p.get("type") or "").lower() == "unknown":
            ignored += 1

    exec_rows = _read_csv_rows("logs/execution_logs.csv")
    mit_rows = _read_csv_rows("logs/mitigation_logs.csv")
    rule_rows = _read_csv_rows("logs/rule_logs.csv")

    mit_success = sum(1 for r in mit_rows if r.get("status") == "success")
    mit_failed = sum(1 for r in mit_rows if r.get("status") == "failed")

    hallucination_types: dict[str, int] = Counter()
    for row in mit_rows:
        reason = row.get("reason", "")
        hallucination_types[_mitigation_reason_bucket(reason)] += 1

    executed = len(exec_rows)
    command_status_counts = {
        "executed": executed,
        "mitigated_ok": mit_success,
        "rejected": mit_failed + ignored,
        "ignored_unknown": ignored,
    }

    dac = _count_device_actions_from_executions()
    device_action_counts = [{"name": k, "count": v} for k, v in dac.most_common(12)]

    graph_data = {
        "hallucination_types": [
            {"name": k, "count": v} for k, v in sorted(hallucination_types.items(), key=lambda x: -x[1])
        ],
        "command_status_counts": [
            {"name": k.replace("_", " ").title(), "count": v}
            for k, v in command_status_counts.items()
        ],
        "device_action_counts": device_action_counts,
    }

    counters = {
        "total_commands": total_commands,
        "valid_commands": executed,
        "hallucinations_detected": len(mit_rows),
        "mitigations_successful": mit_success,
        "rejected_commands": mit_failed + ignored,
    }

    cmd_tail = []
    for row in cmd_rows[-15:][::-1]:
        p = _parse_command_log_row(row)
        cmd_tail.append(
            {
                "timestamp": row.get("timestamp", ""),
                "command": row.get("command", ""),
                "parsed_type": (p or {}).get("type", ""),
            }
        )

    exec_tail = []
    for row in exec_rows[-15:][::-1]:
        exec_tail.append(
            {
                "timestamp": row.get("timestamp", ""),
                "rule_id": row.get("rule_id", ""),
                "summary": row.get("execution_results", ""),
            }
        )

    rule_tail = []
    for row in rule_rows[-12:][::-1]:
        rule_tail.append(
            {
                "timestamp": row.get("timestamp", ""),
                "rule_id": row.get("rule_id", ""),
                "rule_type": row.get("rule_type", ""),
                "trigger": row.get("trigger", ""),
            }
        )

    prefs = _read_json_file("logs/user_preferences.json")
    if not isinstance(prefs, list):
        prefs = []

    room_cards: dict[str, Any] = {}
    order = [
        "living_room",
        "bedroom_1",
        "bedroom_2",
        "kitchen",
        "washroom",
        "garage",
    ]
    for rid in order:
        if rid not in DEVICE_STATE:
            continue
        room_cards[rid] = {
            "room_id": rid,
            "devices": [
                {"device": d, "status": DEVICE_STATE[rid].get(d, "—")}
                for d in sorted(DEVICE_STATE[rid].keys())
            ],
        }

    return {
        "rooms": rooms,
        "devices": devices,
        "sensors": sensors,
        "sensor_to_device_mappings": mappings,
        "current_device_status": room_cards,
        "counters": counters,
        "graph_data": graph_data,
        "command_logs_preview": cmd_tail,
        "execution_logs_preview": exec_tail,
        "rule_logs_preview": rule_tail,
        "user_preferences": prefs,
    }


@app.post("/refresh-state")
def refresh_state() -> dict[str, str]:
    """Reload CSVs and replay execution logs into device state."""
    refresh_static_catalog()
    return {"status": "refreshed"}
