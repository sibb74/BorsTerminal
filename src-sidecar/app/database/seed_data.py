import logging
from app.database.connection import get_db_connection
from app.database.schema import init_db

logger = logging.getLogger("seed_data")

def seed_database():
    """Initializes SQLite database schema cleanly without mock data."""
    init_db()
    logger.info("Database schema initialized cleanly.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_database()
