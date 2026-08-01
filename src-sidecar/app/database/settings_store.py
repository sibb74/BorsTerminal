from typing import Optional
from app.database.connection import get_db_connection

SETTINGS_KEY_BORSAPI = "borsapi_api_key"

def get_setting(key: str) -> Optional[str]:
    conn = get_db_connection()
    row = conn.execute(
        "SELECT value FROM settings WHERE key = ?", (key,)
    ).fetchone()
    conn.close()
    return row["value"] if row else None

def set_setting(key: str, value: str) -> None:
    conn = get_db_connection()
    with conn:
        conn.execute(
            """
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value=excluded.value,
                updated_at=CURRENT_TIMESTAMP;
            """,
            (key, value),
        )
    conn.close()

def delete_setting(key: str) -> None:
    conn = get_db_connection()
    with conn:
        conn.execute("DELETE FROM settings WHERE key = ?", (key,))
    conn.close()

def get_api_key() -> Optional[str]:
    return get_setting(SETTINGS_KEY_BORSAPI)

def set_api_key(api_key: str) -> None:
    set_setting(SETTINGS_KEY_BORSAPI, api_key)

def delete_api_key() -> None:
    delete_setting(SETTINGS_KEY_BORSAPI)
