from flask import request

from db import get_connection
from db_init import initialize_schema


def register_routes(app):
    @app.route("/resources/php/delete.py", methods=["POST"])
    def delete_php():
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)
            if request.method == "POST" and "id" in request.form:
                uid = request.form.get("id")
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM users WHERE userid = %s", (int(uid),))
                    affected = cur.rowcount
                conn.commit()
                if affected > 0:
                    return "1"
                return "Something Went Wrong"
            return ""
        except Exception as exc:
            return str(exc) + "\n"
        finally:
            if conn is not None:
                conn.close()

