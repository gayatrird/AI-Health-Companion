"""Small SQLite helpers. Data is stored for a local demo user only."""

import sqlite3
from contextlib import contextmanager
from pathlib import Path


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password_hash TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS habits (habit_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS habit_logs (log_id INTEGER PRIMARY KEY AUTOINCREMENT, habit_id INTEGER NOT NULL, log_date TEXT NOT NULL, completed INTEGER DEFAULT 0, UNIQUE(habit_id, log_date));
CREATE TABLE IF NOT EXISTS feedback (feedback_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, feedback TEXT NOT NULL, rating INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS symptom_checks (check_id INTEGER PRIMARY KEY AUTOINCREMENT, symptoms TEXT NOT NULL, risk_level TEXT NOT NULL, guidance TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
"""


@contextmanager
def db_connection(path):
    """Open, commit, and always close a SQLite connection."""
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with db_connection(path) as conn:
        conn.executescript(SCHEMA)


def save_habit(path, name, category):
    with db_connection(path) as conn:
        conn.execute("INSERT INTO habits (name, category) VALUES (?, ?)", (name, category))


def toggle_habit(path, habit_id):
    with db_connection(path) as conn:
        exists = conn.execute("SELECT habit_id FROM habits WHERE habit_id = ?", (habit_id,)).fetchone()
        if not exists:
            return False
        conn.execute("INSERT INTO habit_logs (habit_id, log_date, completed) VALUES (?, date('now'), 1) ON CONFLICT(habit_id, log_date) DO UPDATE SET completed = 1 - completed")
    return True


def save_symptom_check(path, symptoms, risk_level, guidance):
    with db_connection(path) as conn:
        conn.execute("INSERT INTO symptom_checks (symptoms, risk_level, guidance) VALUES (?, ?, ?)", (symptoms, risk_level, guidance))


def save_feedback(path, name, email, feedback, rating):
    with db_connection(path) as conn:
        conn.execute("INSERT INTO feedback (name, email, feedback, rating) VALUES (?, ?, ?, ?)", (name, email, feedback, rating))


def get_dashboard_data(path):
    with db_connection(path) as conn:
        habits = conn.execute("SELECT h.habit_id, h.name, h.category, COALESCE(l.completed, 0) AS completed FROM habits h LEFT JOIN habit_logs l ON h.habit_id=l.habit_id AND l.log_date=date('now') ORDER BY h.created_at DESC").fetchall()
        symptoms = conn.execute("SELECT symptoms, risk_level, created_at FROM symptom_checks ORDER BY check_id DESC LIMIT 5").fetchall()
        feedback_count = conn.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
        symptom_count = conn.execute("SELECT COUNT(*) FROM symptom_checks").fetchone()[0]
    completed = sum(row["completed"] for row in habits)
    return {"habits": habits, "completed": completed, "habit_total": len(habits), "symptoms": symptoms, "symptom_count": symptom_count, "feedback_count": feedback_count}
