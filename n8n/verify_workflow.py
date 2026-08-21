import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
workflow = json.loads((ROOT / "workflow.json").read_text(encoding="utf-8"))

def emergency_for(message):
    text = str(message).strip().lower()
    text = " ".join(text.split())
    phrases = ["severe chest pain", "severe difficulty breathing", "unconscious", "severe bleeding"]
    emergency = any(p in text for p in phrases)
    return str(emergency).lower() == "true"

cases = {
    "How can I improve my sleep?": False,
    "I have severe chest pain": True,
    "I have SEVERE difficulty breathing": True,
}
for msg, expected in cases.items():
    got = emergency_for(msg)
    assert got == expected, (msg, got, expected)

node = next(n for n in workflow["nodes"] if n["name"] == "Emergency?")
cond = node["parameters"]["conditions"]["string"][0]
assert cond["value1"] == "={{ String($json.emergency) }}"
assert cond["operation"] == "equals"
assert cond["value2"] == "true"
print("Workflow checks passed.")
for msg, expected in cases.items():
    print(f"{msg!r} -> {str(emergency_for(msg)).lower()}")
