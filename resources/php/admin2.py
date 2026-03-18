from flask import jsonify, session

from db import get_connection
from db_init import initialize_schema


def register_routes(app):
    @app.route("/resources/php/admin2.py", methods=["GET"])
    def admin2_php():
        current_user = session.get("username", "Guest")
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)
            users = []

            with conn.cursor() as cur:
                cur.execute("SELECT userid, username, email, password FROM users ORDER BY userid ASC")
                rows = cur.fetchall() or []

            for row in rows:
                users.append(
                    {
                        "userid": row.get("userid", ""),
                        "username": row.get("username", ""),
                        "email": row.get("email", ""),
                        "password": row.get("password", ""),
                    }
                )

            return jsonify({"currentUser": current_user, "users": users})
        except Exception:
            return jsonify({"error": "Connection failed"}), 500
        finally:
            if conn is not None:
                conn.close()

