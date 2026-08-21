# n8n Workflow Template

`workflow.json` is an optional, credential-free template. The Flask project does
not need n8n to run in demo mode.

## Configure the production webhook

1. Start n8n and open its workflow editor.
2. Import `workflow.json` if the workflow is not already present.
3. Open the **Webhook** node. Keep the method as `POST` and path as `ai-health-companion`.
4. Set **Respond** to **When Last Node Finishes**. The imported template already uses this behavior.
5. Confirm the nodes are connected as: Webhook → Validate Input → Safety Check → Emergency? → Emergency Response or Demo or AI Response.
6. Save the workflow, then switch the **Active** toggle on in the top-right of n8n. This enables the production endpoint:
   `http://localhost:5678/webhook/ai-health-companion`
7. Set this local environment variable before starting Flask:
   `N8N_WEBHOOK_URL=http://localhost:5678/webhook/ai-health-companion`
8. Test the production URL with POST JSON:
   `{"message":"How can I improve my sleep?"}`

The response must be JSON with these fields:

```json
{
  "risk_level": "GENERAL WELLNESS GUIDANCE",
  "guidance": "...",
  "event_logged": true
}
```

The emergency branch remains separate and returns the emergency risk level and
safety guidance. The normal branch returns safe educational wellness guidance.
No credentials are required for the local webhook.

## Flask behavior

`POST /api/wellness` forwards `{ "message": "..." }` to the production
webhook. If n8n returns valid JSON, Flask forwards its `guidance` to the
existing chat interface. If n8n is stopped, inactive, unreachable, or returns
invalid data, Flask uses the existing local demo response safely.

This workflow is a learning architecture, not an emergency assessment system.

## Fast repair for n8n strict-type error

If the published workflow reports `Wrong type: "true" is a string but was expected to be a boolean` in **Emergency?**, import the updated `workflow.json` (or `live-workflows-export.json`) and publish/activate the imported workflow. The `Emergency?` node now compares `String($json.emergency)` to the string `true`, which avoids the strict boolean mismatch seen in n8n 2.x.

After publishing, verify with:

```powershell
Invoke-RestMethod -Uri "http://localhost:5678/webhook/ai-health-companion" -Method POST -ContentType "application/json" -Body '{"message":"I have severe chest pain"}'
Invoke-RestMethod -Uri "http://localhost:5678/webhook/ai-health-companion" -Method POST -ContentType "application/json" -Body '{"message":"How can I improve my sleep?"}'
```
