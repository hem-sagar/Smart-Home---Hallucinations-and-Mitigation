import copy
import csv
import json
import os
from collections import Counter

from module3_hallucination_checker import (
    ROOMS,
    DEVICE_CATALOG,
    SENSOR_CATALOG,
    check_hallucination
)


USER_PRESENCE = {
    "living_room": True,
    "bedroom_1": False,
    "bedroom_2": False,
    "kitchen": False,
    "washroom": False,
    "garage": False
}


def find_device_rooms(device):
    rooms = []

    for room in ROOMS:
        if device in DEVICE_CATALOG.get(room, {}):
            rooms.append(room)

    return rooms


def get_related_devices_for_sensor(sensor):
    for row in SENSOR_CATALOG:
        if row.get("sensor") == sensor:
            related = row.get("related_devices", "")
            return [d.strip() for d in related.split(";") if d.strip()]

    return []


def get_device_from_sensor(action):
    room = action.get("room")
    device = action.get("device")
    act = action.get("action")

    related_devices = get_related_devices_for_sensor(device)

    if not related_devices:
        return None, "No related device found for sensor"

    room_devices = DEVICE_CATALOG.get(room, {})

    for related_device in related_devices:
        if related_device in room_devices:
            allowed_actions = room_devices[related_device]

            if act in allowed_actions:
                return related_device, f"Mapped sensor '{device}' to device '{related_device}'"

            if "turn_on" in allowed_actions:
                action["action"] = "turn_on"
                return related_device, f"Mapped sensor '{device}' to device '{related_device}' with action 'turn_on'"

    return None, f"No related device available in room '{room}'"


def get_rooms_with_user_presence(device):
    rooms = []

    for room, present in USER_PRESENCE.items():
        if present and device in DEVICE_CATALOG.get(room, {}):
            rooms.append(room)

    return rooms


def get_most_used_room_from_logs(device, candidate_rooms):
    log_file = "logs/command_logs.csv"

    if not os.path.exists(log_file):
        return None, "No command log found"

    room_counter = Counter()
    latest_room = None

    with open(log_file, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            parsed_text = row.get("parsed_output")

            if not parsed_text:
                continue

            try:
                parsed = json.loads(parsed_text)
            except Exception:
                continue

            for action in parsed.get("actions", []):
                room = action.get("room")
                action_device = action.get("device")

                if action_device == device and room in candidate_rooms:
                    room_counter[room] += 1
                    latest_room = room

    if not room_counter:
        return None, "No past usage found"

    most_common = room_counter.most_common()

    if len(most_common) == 1:
        return most_common[0][0], "Selected room from most-used command history"

    if most_common[0][1] > most_common[1][1]:
        return most_common[0][0], "Selected room from most-used command history"

    if latest_room:
        return latest_room, "Selected room from latest command history"

    return None, "History tied and no latest room found"


def infer_room(device):
    possible_rooms = find_device_rooms(device)

    if len(possible_rooms) == 1:
        return possible_rooms[0], f"Selected '{possible_rooms[0]}' because device exists only there"

    present_rooms = get_rooms_with_user_presence(device)

    if len(present_rooms) == 1:
        return present_rooms[0], f"Selected '{present_rooms[0]}' because user is present there"

    if len(present_rooms) > 1:
        room, reason = get_most_used_room_from_logs(device, present_rooms)

        if room:
            return room, reason

        return None, f"User present in multiple rooms {present_rooms}. Need clarification."

    room, reason = get_most_used_room_from_logs(device, possible_rooms)

    if room:
        return room, reason

    return None, f"Device '{device}' exists in multiple rooms {possible_rooms}. Need clarification."


def mitigate_action(action):
    fixed = copy.deepcopy(action)

    room = fixed.get("room")
    device = fixed.get("device")

    # Case 1: unknown room
    if room in ["unknown", "", None]:
        inferred_room, reason = infer_room(device)

        if inferred_room:
            fixed["room"] = inferred_room
            return fixed, reason

        return fixed, reason

    # Case 2: LLM used sensor as device, e.g. temperature as device
    related_device, reason = get_device_from_sensor(fixed)

    if related_device:
        fixed["device"] = related_device
        return fixed, reason

    # Case 3: device exists, but in another room
    if room in ROOMS:
        if device not in DEVICE_CATALOG.get(room, {}):
            possible_rooms = find_device_rooms(device)

            if len(possible_rooms) == 1:
                fixed["room"] = possible_rooms[0]
                return fixed, f"Moved device '{device}' to room '{possible_rooms[0]}'"

            if len(possible_rooms) > 1:
                inferred_room, reason = infer_room(device)

                if inferred_room:
                    fixed["room"] = inferred_room
                    return fixed, reason

                return fixed, reason

    return fixed, "No mitigation found"


def save_mitigation_log(original_rule, fixed_rule, status, reason):
    os.makedirs("logs", exist_ok=True)

    file_path = "logs/mitigation_logs.csv"
    file_exists = os.path.isfile(file_path)

    with open(file_path, "a", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow([
                "status",
                "reason",
                "original_rule",
                "fixed_rule"
            ])

        writer.writerow([
            status,
            reason,
            json.dumps(original_rule),
            json.dumps(fixed_rule)
        ])


def mitigate_rule(rule):
    original_rule = copy.deepcopy(rule)
    current_rule = copy.deepcopy(rule)

    previous_rule = None
    last_reason = ""

    while True:
        valid, message = check_hallucination(current_rule)

        if valid:
            save_mitigation_log(
                original_rule,
                current_rule,
                "success",
                last_reason
            )
            return current_rule, "mitigated_successfully"

        if previous_rule == current_rule:
            save_mitigation_log(
                original_rule,
                current_rule,
                "failed",
                "No further improvement possible"
            )
            return current_rule, "mitigation_failed"

        previous_rule = copy.deepcopy(current_rule)
        changed = False

        for i, action in enumerate(current_rule.get("actions", [])):
            fixed_action, reason = mitigate_action(action)

            if fixed_action != action:
                current_rule["actions"][i] = fixed_action
                changed = True
                last_reason = reason
                print("Mitigation:", reason)
                break

        if not changed:
            save_mitigation_log(
                original_rule,
                current_rule,
                "failed",
                message
            )
            return current_rule, "mitigation_failed"