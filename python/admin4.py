from flask import jsonify, session

from common import format_pst_to_ist
from db import get_connection
from db_init import initialize_schema


def register_routes(app):
    @app.route("/python/admin4.py", methods=["GET"])
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
                        "datetime": format_pst_to_ist(row.get("datetime", "")),
                    }
                )

            return jsonify({"currentUser": current_user, "logs": logs})
        except Exception:
            return jsonify({"error": "Connection failed"}), 500
        finally:
            if conn is not None:
                conn.close()

