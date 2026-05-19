import psycopg2
from psycopg2.extras import DictCursor
from queue import Empty, Full, LifoQueue

from config import database_url


_POOL = LifoQueue(maxsize=6)


class PooledConnection:
    def __init__(self, conn):
        self._conn = conn
        self._released = False

    def __getattr__(self, item):
        return getattr(self._conn, item)

    def close(self) -> None:
        if self._released:
            return
        self._released = True
        try:
            self._conn.rollback()
        except Exception:
            pass

        try:
            _POOL.put_nowait(self._conn)
        except Full:
            try:
                self._conn.close()
            except Exception:
                pass


def _new_connection():
    """Create a new PostgreSQL connection using DATABASE_URL only."""
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set")

    return psycopg2.connect(database_url, cursor_factory=DictCursor, sslmode="require")


def get_connection():
    """Get a connection from pool or create new one"""
    conn = None
    try:
        conn = _POOL.get_nowait()
    except Empty:
        conn = _new_connection()

    try:
        # Test connection is alive
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        conn = _new_connection()

    return PooledConnection(conn)
