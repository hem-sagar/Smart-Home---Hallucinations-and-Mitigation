from module2_rule_generator import run_module2

parsed = {
  "type": "multi_action",
  "actions": [
    {
      "room": "living_room",
      "device": "ac",
      "action": "turn_on",
    },
    {
      "room": "living_room",
      "device": "tv",
      "action": "turn_off",
    }
  ]
}

rule = run_module2(parsed)

print("\nGenerated Rule:")
print(rule)