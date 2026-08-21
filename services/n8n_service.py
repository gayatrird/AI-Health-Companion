"""Small n8n webhook client for the Wellness Assistant.

The app deliberately falls back to the local demo response if n8n is stopped,
the production workflow is inactive, or its response is not valid.
"""

import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def request_wellness_guidance(webhook_url, message, timeout=5):
    """Send a wellness message to n8n and return its safe response JSON.

    Raises RuntimeError on network, HTTP, JSON, or response-shape errors so the
    Flask route can use its existing local demo response as a safe fallback.
    """
    if not webhook_url:
        raise RuntimeError("n8n webhook URL is not configured.")

    payload = json.dumps({"message": message}).encode("utf-8")
    request = Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except (HTTPError, URLError, TimeoutError) as error:
        raise RuntimeError(f"n8n webhook request failed: {error}") from error

    try:
        result = json.loads(body)
    except json.JSONDecodeError as error:
        raise RuntimeError("n8n webhook returned invalid JSON.") from error

    required_fields = ("risk_level", "guidance", "event_logged")
    if not isinstance(result, dict) or not all(field in result for field in required_fields):
        raise RuntimeError("n8n webhook response is missing required fields.")
    if not isinstance(result["risk_level"], str) or not isinstance(result["guidance"], str):
        raise RuntimeError("n8n webhook response has invalid text fields.")

    return {
        "risk_level": result["risk_level"],
        "guidance": result["guidance"],
        "event_logged": bool(result["event_logged"]),
    }
