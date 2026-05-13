import path_setup
from module4_mitigation import mitigate_rule

rule = {
    "actions": [
        {
            "room": "living_room",
            "device": "temperature",
            "action": "set_temperature",
            "value": "decrease"
        }
    ]
}

fixed_rule, status = mitigate_rule(rule)

print("\nFixed Rule:")
print(fixed_rule)
print("Status:", status)

exhaust_rule = {
    "actions": [
        {
            "room": "unknown",
            "device": "exhaust",
            "action": "turn_on",
            "value": None,
            "condition": None,
        }
    ]
}

fixed_exhaust, exhaust_status = mitigate_rule(exhaust_rule)
assert exhaust_status == "mitigated_successfully", exhaust_status
assert fixed_exhaust["actions"][0]["device"] == "exhaust_fan"
assert fixed_exhaust["actions"][0]["room"] == "kitchen"
print("\nExhaust alias + room:", fixed_exhaust["actions"][0], exhaust_status)