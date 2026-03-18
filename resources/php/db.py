import pymysql
from queue import Empty, Full, LifoQueue

from config import dbname, password, servername, username


_POOL = LifoQueue(maxsize=6)


class PooledConnection:
    def __init__(self, conn: pymysql.connections.Connection):
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


def _new_connection() -> pymysql.connections.Connection:
    return pymysql.connect(
        host=servername,
        user=username,
        password=password,
        database=dbname,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=10,
        read_timeout=20,
        write_timeout=20,
    )


def get_connection() -> pymysql.connections.Connection:
    conn = None
    try:
        conn = _POOL.get_nowait()
    except Empty:
        conn = _new_connection()

    try:
        conn.ping(reconnect=True)
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        conn = _new_connection()

    return PooledConnection(conn)
