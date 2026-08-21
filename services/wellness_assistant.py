"""Local safe responses for wellness questions in demo mode."""

def answer_wellness_question(question):
    q = question.lower()
    if any(word in q for word in ["sleep", "insomnia", "tired"]):
        advice = "Try a consistent sleep and wake time, a calming wind-down routine, and limiting bright screens close to bedtime. Daytime activity and a comfortable sleep space can also support sleep."
    elif any(word in q for word in ["water", "hydration", "hydrate"]):
        advice = "Keep water available through the day and drink regularly, especially around activity or warm weather. Your needs can vary, so notice thirst and choose fluids that suit you."
    elif any(word in q for word in ["exercise", "activity", "workout"]):
        advice = "Choose enjoyable movement appropriate for your abilities, such as walking, stretching, cycling, or a sport. Start gradually and make regular movement part of your routine."
    elif any(word in q for word in ["food", "eat", "nutrition", "diet"]):
        advice = "Aim for a balanced variety of foods, including fruits, vegetables, whole grains, protein sources, and regular meals where possible. Small sustainable changes are often easiest to maintain."
    elif any(word in q for word in ["stress", "anxiety", "relax"]):
        advice = "Short breaks, breathing exercises, movement, a relaxing hobby, and talking with someone you trust can support stress management. If stress feels overwhelming, consider professional support."
    else:
        advice = "Healthy routines often include regular sleep, hydration, balanced meals, movement, and time to relax. Start with one small realistic habit and build from there."
    return advice + " This is general educational wellness information, not a medical diagnosis or personal medical advice."
