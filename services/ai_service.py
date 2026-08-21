"""Future integration point for IBM watsonx. Demo mode uses local responses."""
import os

def get_ai_mode():
    return os.getenv("AI_MODE", "mock").lower()

def watsonx_configuration_ready():
    return all(os.getenv(key) for key in ("IBM_API_KEY", "IBM_PROJECT_ID", "IBM_URL"))
