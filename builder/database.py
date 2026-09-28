import sqlite3
import json

DB_PATH = 'projects.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT,
                data TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def list_projects():
    with get_db() as conn:
        rows = conn.execute("SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC").fetchall()
        return [{"id": r["id"], "name": r["name"], "updated_at": r["updated_at"]} for r in rows]

def get_project(project_id):
    with get_db() as conn:
        row = conn.execute("SELECT data FROM projects WHERE id = ?", (project_id,)).fetchone()
        if row: return json.loads(row["data"])
        return None

def save_project(project_id, name, data):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO projects (id, name, data, updated_at) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET 
                name=excluded.name, data=excluded.data, updated_at=CURRENT_TIMESTAMP
        """, (project_id, name, json.dumps(data)))

def delete_project(project_id):
    with get_db() as conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
