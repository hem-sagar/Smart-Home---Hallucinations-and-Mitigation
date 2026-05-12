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