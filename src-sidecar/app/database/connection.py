import sqlite3
from pathlib import Path
from app.config import settings

def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection configured for WAL mode."""
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn
