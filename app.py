"""AI Health Companion Flask application (demo mode works without API keys)."""

import os

from flask import Flask, jsonify, render_template, request

from database import get_dashboard_data, init_db, save_feedback, save_habit, save_symptom_check, toggle_habit
from services.symptom_checker import assess_symptoms
from services.n8n_service import request_wellness_guidance
from services.wellness_assistant import answer_wellness_question


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        DATABASE="database/health.db",
        AI_MODE=os.getenv("AI_MODE", "mock").lower(),
        N8N_WEBHOOK_URL=os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/ai-health-companion"),
    )
    if test_config:
        app.config.update(test_config)

    init_db(app.config["DATABASE"])

    @app.route("/")
    def home():
        return render_template("index.html")

    @app.route("/symptom-checker")
    def symptom_checker():
        return render_template("symptom_checker.html")

    @app.route("/wellness")
    def wellness():
        return render_template("wellness.html")

    @app.route("/login")
    def login():
        return render_template("login.html")

    @app.route("/register")
    def register():
        return render_template("register.html")

    @app.route("/habits")
    def habits():
        return render_template("habits.html")

    @app.route("/health-info")
    def health_info():
        return render_template("health_info.html")

    @app.route("/emergency")
    def emergency():
        return render_template("emergency.html")

    @app.route("/feedback")
    def feedback():
        return render_template("feedback.html")

    @app.route("/dashboard")
    def dashboard():
        # Firebase dashboard data is loaded client-side after authentication.
        # SQLite remains available to the original REST endpoints in demo mode.
        return render_template("dashboard.html")

    @app.post("/api/symptom-check")
    def symptom_check_api():
        data = request.get_json(silent=True) or {}
        symptoms = str(data.get("symptoms", "")).strip()
        selected = data.get("selected_symptoms", [])
        if not isinstance(selected, list):
            return jsonify(error="Selected symptoms must be a list."), 400
        combined = ", ".join(str(item) for item in selected) + (". " + symptoms if symptoms else "")
        if not combined.strip(". ,"):
            return jsonify(error="Please select or describe at least one symptom."), 400
        result = assess_symptoms(combined, data.get("age"), data.get("duration"), data.get("severity"))
        save_symptom_check(app.config["DATABASE"], combined, result["risk_level"], result["guidance"])
        return jsonify(result)

    @app.post("/api/wellness")
    def wellness_api():
        data = request.get_json(silent=True) or {}
        message = str(data.get("message", "")).strip()
        if not message:
            return jsonify(error="Please enter a wellness question."), 400
        if len(message) > 800:
            return jsonify(error="Please keep the question under 800 characters."), 400
        try:
            workflow_result = request_wellness_guidance(app.config["N8N_WEBHOOK_URL"], message)
            return jsonify(response=workflow_result["guidance"], mode="n8n", **workflow_result)
        except RuntimeError as error:
            app.logger.info("Wellness Assistant is using local demo fallback: %s", error)
            return jsonify(
                response=answer_wellness_question(message),
                mode=app.config["AI_MODE"],
                risk_level="GENERAL WELLNESS GUIDANCE",
                event_logged=False,
            )

    @app.post("/api/habits")
    def habits_api():
        data = request.get_json(silent=True) or {}
        action = data.get("action", "add")
        if action == "toggle":
            habit_id = data.get("habit_id")
            if not isinstance(habit_id, int):
                return jsonify(error="A valid habit id is required."), 400
            updated = toggle_habit(app.config["DATABASE"], habit_id)
            if not updated:
                return jsonify(error="Habit not found."), 404
            return jsonify(success=True, message="Habit progress updated.")
        name = str(data.get("name", "")).strip()
        category = str(data.get("category", "General")).strip()
        if not name or len(name) > 80:
            return jsonify(error="Enter a habit name of up to 80 characters."), 400
        save_habit(app.config["DATABASE"], name, category[:40])
        return jsonify(success=True, message="Habit added to today's tracker.")

    @app.post("/api/feedback")
    def feedback_api():
        data = request.get_json(silent=True) or {}
        feedback_text = str(data.get("feedback", "")).strip()
        try:
            rating = int(data.get("rating"))
        except (TypeError, ValueError):
            rating = None
        if not feedback_text:
            return jsonify(error="Please write your feedback."), 400
        if len(feedback_text) > 1000:
            return jsonify(error="Feedback must be under 1000 characters."), 400
        if rating not in [1, 2, 3, 4, 5]:
            return jsonify(error="Please choose a rating from 1 to 5."), 400
        save_feedback(app.config["DATABASE"], str(data.get("name", "")).strip()[:80], str(data.get("email", "")).strip()[:120], feedback_text, rating)
        return jsonify(success=True, message="Thank you! Your feedback was saved.")

    @app.get("/api/health")
    def health_api():
        return jsonify(status="ok", mode=app.config["AI_MODE"], message="AI Health Companion is running in safe educational demo mode.")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
