# AI Health Companion — Fast n8n Repair

Updated by ChatGPT from the uploaded project archive.

## Fixed
- `n8n/workflow.json`: changed `Emergency?` to a string-safe comparison (`String($json.emergency)` equals `true`) to avoid n8n 2.x strict boolean/string execution errors.
- `n8n/live-workflows-export.json`: patched the same live-export condition so importing it carries the fix.
- `n8n/verify_workflow.py`: local verification script for normal/emergency detection and the patched IF condition.
- `n8n/README.md`: added the fast repair/test instructions.

## Verification performed here
- Workflow JSON parsed successfully.
- Emergency detection checks passed for sleep, severe chest pain, and severe difficulty breathing.
- Flask → n8n client contract was tested against a local mock HTTP webhook and passed.

## One manual step remains
The uploaded ZIP cannot modify the n8n instance running on the user's laptop. Import/reload the patched `n8n/workflow.json` (or patched `n8n/live-workflows-export.json`) into the local n8n instance, publish it, then test the production webhook.
