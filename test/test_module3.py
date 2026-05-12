import path_setup
from module3_hallucination_checker import check_hallucination

rule = {
    "actions": [
        {
            "room": "washroom",
            "device": "ac",
            "action": "turn_on"
        }
    ]
}

valid, message = check_hallucination(rule)

print(valid)
print(message)