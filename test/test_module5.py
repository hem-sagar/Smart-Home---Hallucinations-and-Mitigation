from module5_execution import run_execution

rule = {
    "rule_id": "test",
    "rule_type": "simple",
    "actions": [
        {
            "room": "living_room",
            "device": "ac",
            "action": "turn_on",
            "value": None
        }
    ]
}

run_execution(rule)