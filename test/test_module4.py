import path_setup
import os

# Windows consoles may default to a legacy code page; module3 prints Unicode arrows.
os.environ.setdefault("PYTHONUTF8", "1")

from module4_mitigation import mitigate_rule

rule = {
    "actions": [
       {
  "type": "simple",
  "phrase": "turn_on_ac",
  "actions": [
    {
      "room": "office",
      "device": "ac",
      "action": "turn_on",
      "value": "",
    }
  ]
}
    ]
}

fixed_rule, status = mitigate_rule(rule, user_id="father")

print("\nFixed Rule:")
print(fixed_rule)
print("Status:", status)