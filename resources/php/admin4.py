from datetime import datetime, timedelta, timezone

from flask import jsonify, session

from db import get_connection
from db_init import initialize_schema


IST = timezone(timedelta(hours=5, minutes=30))


def _format_ist(value):
    if not value:
        return ""
    if isinstance(value, datetime):
        dt = value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        return dt.astimezone(IST).strftime("%Y-%m-%d %I:%M:%S %p IST")
    return str(value)


def register_routes(app):
    @app.route("/resources/php/admin4.py", methods=["GET"])
    def admin4_php():
        current_user = session.get("username", "Guest")
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)
            logs = []
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT a.userid AS userid, u.email AS email, a.event AS event, a.logged_at AS datetime
                    FROM activity_log a
                    LEFT JOIN users u ON u.userid = a.userid
                    ORDER BY a.logged_at DESC
                    """
                )
                rows = cur.fetchall() or []

            for row in rows:
                logs.append(
                    {
                        "userid": row.get("userid", ""),
                        "email": row.get("email", ""),
                        "event": row.get("event", ""),
                        "datetime": _format_ist(row.get("datetime", "")),
                    }
                )

            return jsonify({"currentUser": current_user, "logs": logs})
        except Exception:
            return jsonify({"error": "Connection failed"}), 500
        finally:
            if conn is not None:
                conn.close()

