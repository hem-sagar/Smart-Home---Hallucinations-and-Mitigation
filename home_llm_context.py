"""
Compact home-layout text for LLM prompts (module1, module2).
Built from data/*.csv so parsers and rule generators match this home's rooms, devices, and sensors.
"""

from __future__ import annotations

import csv
import os


def _read_csv(path: str) -> list[dict[str, str]]:
    if not os.path.isfile(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build_home_digest_for_prompt(max_device_rows: int = 80) -> str:
    rooms = [r["room"] for r in _read_csv("data/rooms.csv") if r.get("room")]
    devices = _read_csv("data/devices.csv")
    sensors = _read_csv("data/sensors.csv")

    lines: list[str] = []
    lines.append(
        "AUTHORITATIVE HOME DATA (from your rooms / devices / sensors files) — "
        "use ONLY these ids (snake_case)."
    )
    lines.append("VALID_ROOMS: " + ", ".join(rooms))
    lines.append("DEVICES (room | device | allowed_actions):")
    for i, d in enumerate(devices):
        if i >= max_device_rows:
            lines.append(f"  ... ({len(devices) - max_device_rows} more rows)")
            break
        lines.append(
            f"  {d.get('room', '')!s} | {d.get('device', '')!s} | {d.get('allowed_actions', '')!s}"
        )
    lines.append("SENSORS (sensor | location | allowed_operators | min_value | max_value):")
    for s in sensors:
        lines.append(
            f"  {s.get('sensor', '')!s} | {s.get('location', '')!s} | "
            f"{s.get('allowed_operators', '')!s} | {s.get('min_value', '')!s} | {s.get('max_value', '')!s}"
        )
    return "\n".join(lines)
