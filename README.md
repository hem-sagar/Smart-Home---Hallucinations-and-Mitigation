# Smart Home: Hallucinations and Mitigation

This project parses natural-language smart-home commands, builds rules, and **checks every rule against your saved home data** (`data/rooms.csv`, `data/devices.csv`, `data/sensors.csv`). The parser and rule generator **see the same room/device/sensor lists in their prompts** so outputs target real rooms, devices, and sensors. When the model output still does not match that home, we treat that as a **hallucination** and try **mitigation** before rejecting or executing the command.

---

## Hallucination checks

Hallucination detection is **validation against your saved home files**, not a separate ML model. Anything that fails these checks is reported as invalid (the message you see in the CLI or API is the hallucination detail).

### Actions (`check_action` / `check_action_for_all_rooms`)

| Check | Typical cause |
|--------|------------------|
| **Unknown room** | Room name is not in `rooms.csv` and is not `all` (e.g. parser used `unknown` as a placeholder). |
| **Wrong room for device** | Device exists in the home but not in the room named on the action. |
| **Unknown device in room** | Device id does not appear under that room in `devices.csv`. |
| **Invalid action** | Action is not listed in that row’s `allowed_actions`. |
| **Whole-house (`all`)** | For `room: "all"`, the device must exist in **at least one** room; for **each** room that lists that device, the action must be allowed there. |

### Conditions (`check_single_condition`)

| Check | Typical cause |
|--------|------------------|
| **Sensor / location** | Sensor is not defined for that location in `sensors.csv` (after normalizing `house` / `home` / `whole_house` → `all`). |
| **Operator** | Operator is not in that sensor’s `allowed_operators`. |
| **Value range** | Numeric value is outside `min_value` / `max_value` for that sensor. |
| **Value type** | Value cannot be interpreted as a number when a numeric range applies. |

Rules are invalid if **any** action fails or **any** condition in the rule’s condition groups fails.

---

## Mitigation types

Mitigation runs only when validation fails. It **mutates a copy of the rule** in small steps until validation passes or no further change is possible. **`mitigate_rule`** first **flattens** nested `actions` shapes (e.g. `{ type, actions: [...] }`) into normal top-level device actions so room/device checks apply.

### Action mitigation (`mitigate_action`)

Applied in order until one strategy changes the action:

1. **Unknown, empty, or room name not in your home** (e.g. parser used `unknown`, or a name not in `rooms.csv` like `office`) — after resolving **where the device exists** in `devices.csv`, picks a room in this order: **user present in exactly one of those rooms** → else **saved preference** for this `user_id` + device (from `logs/user_preferences.json`) if that room is valid for the device → else **presence in multiple rooms** (history / latest command among those) → else **command history** across all rooms that have the device → else **latest log row** tie-break → else **two-room** first in home order, else needs clarification.
2. **Sensor named as device** — If the “device” field matches a sensor that has `related_devices` in `sensors.csv`, rewrites to an actual device in the same room (and may normalize the action, e.g. toward `turn_on`).
3. **Wrong room, device exists elsewhere** — If the room is valid but the device is not in that room, moves the action to the only room in your data that has the device, or uses the same **infer_room** logic when multiple rooms apply.

If nothing applies, the action is unchanged and mitigation may try **conditions** next.

### Condition mitigation (`mitigate_condition`)

- Parses a **raw string** condition (e.g. `temperature > 30`) into `sensor`, `operator`, `value`.
- **Sensor token aliases** (e.g. `temp` → `temperature`, `gas` → `gas_sensor`).
- Normalizes operators (e.g. `=` → `==`).
- **Location**: fills missing location from the first action’s room, or `all` when the action room is unknown.
- **Value clamping**: soft bounds for temperature/humidity, then clamp to the min/max defined for that sensor in your sensor file when defined.

### Mitigation loop (`mitigate_rule`)

Repeatedly runs `check_hallucination`; on failure, fixes **one** action (first changeable) or **one** condition (first changeable group item), then re-validates. Stops when the rule is valid or the rule no longer changes (**mitigation failed**).

### Logged outcomes (`logs/mitigation_logs.csv`)

- **`success`** — Rule became valid (either unchanged from the start in that call path, or fixed and then validated).
- **`failed`** — No further automatic fix; the command should be clarified or rephrased by the user.

API / CLI copy uses string statuses such as **`mitigated_successfully`** and **`mitigation_failed`** for the last mitigation pass.

---

## How to run

Prerequisites: **Python 3.8+**, **Node.js** (for the dashboard), **`pip install -r requirements.txt`**, **`npm install`** inside `frontend/`, and a **`.env`** in the project root with `OPENAI_API_KEY=` for LLM parsing and rule generation.

Always run commands from the **repository root** (where `data/` and `logs/` resolve correctly).

### One command: API + dashboard (`run.py`)

Starts **FastAPI** on `http://127.0.0.1:8000` and **Vite** on `http://127.0.0.1:5173` in one terminal. Stop with **Ctrl+C**.

```bash
python run.py
```

Options:

```bash
python run.py --help
python run.py --backend-only
python run.py --frontend-only
python run.py --no-reload
python run.py --port 8000
```

### CLI pipeline only (`run_pipeline.py`)

Interactive terminal: choose user (`father` / `mother` / `son`), enter commands, type `exit` to quit.

```bash
python run_pipeline.py
```

### Backend or frontend alone

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

```bash
cd frontend && npm run dev
```

Optional: set `VITE_API_URL` if the API is not on `http://localhost:8000`.

### Tests

```bash
python -m pytest test/
```

---

## License

Specify your license here.
