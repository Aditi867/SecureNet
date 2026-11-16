
import sqlite3
import json
from pathlib import Path


BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "live_detection_history.db"


def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    return sqlite3.connect(DB_PATH, timeout=30)


def initialize_database():

    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS detection_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                captured_at REAL,
                classification TEXT,
                risk_level TEXT,
                malicious_probability REAL,
                record_json TEXT NOT NULL
            )
        """)

        conn.commit()


def save_flow(flow):

    initialize_database()

    with get_connection() as conn:
        conn.execute("""
            INSERT INTO detection_history (
                captured_at,
                classification,
                risk_level,
                malicious_probability,
                record_json
            )
            VALUES (?, ?, ?, ?, ?)
        """, (
            flow.get("captured_at"),
            flow.get("classification", "Error"),
            flow.get("risk_level"),
            flow.get("malicious_probability"),
            json.dumps(flow)
        ))

        conn.commit()


def get_history(limit=500):

    initialize_database()

    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, record_json
            FROM detection_history
            ORDER BY id DESC
            LIMIT ?
        """, (limit,)).fetchall()

    records = []

    for row_id, record_json in rows:
        record = json.loads(record_json)
        record["history_id"] = row_id
        records.append(record)

    return records


def get_all_history():

    initialize_database()

    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, record_json
            FROM detection_history
            ORDER BY id DESC
        """).fetchall()

    records = []

    for row_id, record_json in rows:
        record = json.loads(record_json)
        record["history_id"] = row_id
        records.append(record)

    return records


initialize_database()
