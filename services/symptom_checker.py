"""Transparent rule-based, non-diagnostic safety guidance."""

RED_FLAGS = ["severe difficulty breathing", "severe chest pain", "loss of consciousness", "unconscious", "severe confusion", "uncontrolled bleeding", "severe bleeding", "seizure", "sudden severe weakness"]
PROFESSIONAL_CARE = ["vomiting", "stomach pain", "dizziness", "shortness of breath", "fever", "headache"]


def assess_symptoms(symptoms, age=None, duration=None, severity=None):
    text = symptoms.lower()
    red_flags = [flag for flag in RED_FLAGS if flag in text]
    if red_flags or str(severity).lower() == "severe":
        return {"risk_level": "EMERGENCY / SEEK IMMEDIATE CARE", "is_emergency": True, "matched_flags": red_flags or ["severe symptom selected"], "guidance": "⚠️ This may require urgent professional attention. Do not rely on this application for emergency assessment. Contact local emergency services or seek immediate professional medical care."}
    professional = [item for item in PROFESSIONAL_CARE if item in text]
    if professional or str(duration).lower() in ("more than 3 days", "more than a week"):
        return {"risk_level": "CONTACT A HEALTHCARE PROFESSIONAL", "is_emergency": False, "matched_flags": professional, "guidance": "These symptoms can have several causes. This tool cannot determine a diagnosis. Consider contacting a qualified healthcare professional, especially if symptoms persist, worsen, or concern you. General support may include rest, regular fluids, and monitoring how you feel."}
    return {"risk_level": "GENERAL WELLNESS GUIDANCE", "is_emergency": False, "matched_flags": [], "guidance": "This information is educational and cannot determine a diagnosis. Consider rest, regular fluids, balanced meals, and monitoring your symptoms. Seek professional medical advice if symptoms persist, worsen, or concern you."}
