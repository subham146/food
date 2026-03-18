from flask import request, session
from werkzeug.security import generate_password_hash

from common import clean
from db import get_connection
from db_init import initialize_schema


def register_routes(app):
    @app.route("/resources/php/change.py", methods=["POST"])
    def change_php():
        conn = None
        response_text = ""
        try:
            conn = get_connection()
            initialize_schema(conn)

            if request.method == "POST":
                form = request.form
                if "pwd2" in form and "pwd3" in form:
                    _pwd = clean(form.get("pwd2", ""))
                    pwd3 = clean(form.get("pwd3", ""))
                    emailpt = session.get("email")

                    with conn.cursor() as cur:
                        cur.execute("SELECT userid, email FROM users WHERE email = %s", (emailpt,))
                        row = cur.fetchone()

                    if row:
                        user_id = row.get("userid")
                        hashed = generate_password_hash(pwd3)
                        with conn.cursor() as cur:
                            cur.execute("UPDATE users SET password = %s WHERE email = %s", (hashed, emailpt))
                            cur.execute(
                                "INSERT INTO activity_log (userid, event) VALUES (%s, %s)",
                                (user_id, "Reset Password"),
                            )
                        conn.commit()
                        response_text = "Password updated successfully"
                    else:
                        response_text = "Invalid credentials2"
                else:
                    raise Exception("Error: One or more form fields are missing.")
        except Exception as exc:
            response_text = str(exc) + "\n"
        finally:
            if conn is not None:
                conn.close()
            session.clear()

        return response_text

