import random
import hmac
from datetime import datetime, timedelta, timezone

from flask import request, session
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_connection
from db_init import initialize_schema
from mailer import send_html_mail


def register_routes(app):
    @app.route("/resources/php/login.py", methods=["POST"])
    def login_php():
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)

            if request.method == "POST":
                form = request.form

                if "username" in form and "pwd" in form:
                    user_identifier = (form.get("username", "") or "").strip()
                    passwordpt = (form.get("pwd", "") or "").strip()

                    if user_identifier == "" or passwordpt == "":
                        return "Error: All fields are required."

                    with conn.cursor() as cur:
                        if user_identifier.isdigit():
                            cur.execute(
                                """
                                SELECT userid, username, email, password
                                FROM users
                                WHERE userid = %s
                                   OR LOWER(username) = LOWER(%s)
                                   OR LOWER(email) = LOWER(%s)
                                LIMIT 1
                                """,
                                (int(user_identifier), user_identifier, user_identifier),
                            )
                        else:
                            cur.execute(
                                """
                                SELECT userid, username, email, password
                                FROM users
                                WHERE LOWER(username) = LOWER(%s)
                                   OR LOWER(email) = LOWER(%s)
                                LIMIT 1
                                """,
                                (user_identifier, user_identifier),
                            )
                        row = cur.fetchone()

                    stored_password = row.get("password", "") if row else ""
                    password_ok = False
                    used_legacy_plain = False

                    if row and stored_password:
                        try:
                            password_ok = check_password_hash(stored_password, passwordpt)
                        except ValueError:
                            password_ok = False

                        if not password_ok and hmac.compare_digest(stored_password, passwordpt):
                            password_ok = True
                            used_legacy_plain = True

                    if row and password_ok:
                        user_id = row.get("userid")
                        username = row.get("username", "")
                        email = row.get("email", "")

                        session["username"] = username
                        session["email"] = email
                        session["userId"] = user_id

                        otppt = str(random.randint(0, 999999)).zfill(6)
                        body = (
                            "Hi "
                            + username
                            + ",<br><br>Your OTP for Login is: "
                            + otppt
                            + "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to login to Foodelight.<br><br>Thanks,<br>Foodelight"
                        )
                        sent, error = send_html_mail(email, "Login Authentication", body)
                        if sent:
                            expires_at = datetime.now(timezone.utc) + timedelta(minutes=2)
                            with conn.cursor() as cur:
                                cur.execute(
                                    "INSERT INTO otp (userid, otp, expires_at, is_used) VALUES (%s, %s, %s, %s)",
                                    (user_id, otppt, expires_at, 0),
                                )
                                if used_legacy_plain:
                                    cur.execute(
                                        "UPDATE users SET password = %s WHERE userid = %s",
                                        (generate_password_hash(passwordpt), user_id),
                                    )
                            conn.commit()
                            return "OTP has been sent to your email"

                        return "ERROR" if not error else "Message could not be sent. Mailer Error: " + error

                    return "Invalid credentials"

                if "otp" in form:
                    try:
                        userid = session.get("userId")
                        otp = (form.get("otp", "") or "").strip()

                        with conn.cursor() as cur:
                            cur.execute(
                                "SELECT id, expires_at FROM otp WHERE userid = %s AND otp = %s AND is_used = 0",
                                (userid, otp),
                            )
                            otp_row = cur.fetchone()

                        if otp_row:
                            expires_at = otp_row.get("expires_at")
                            if expires_at is None:
                                return "Invalid OTP!"
                            if expires_at.tzinfo is None:
                                expires_at = expires_at.replace(tzinfo=timezone.utc)
                            if datetime.now(timezone.utc) > expires_at:
                                return "OTP expired!"

                            with conn.cursor() as cur:
                                cur.execute("UPDATE otp SET is_used = 1 WHERE id = %s", (otp_row.get("id"),))
                                cur.execute(
                                    "INSERT INTO activity_log (userid, event) VALUES (%s, %s)",
                                    (userid, "Login to Foodelight"),
                                )
                            conn.commit()
                            return "OTP is valid."

                        return "Invalid OTP!"
                    except Exception as exc:
                        return "Error: " + str(exc)

                if "username" in form:
                    user_identifier = (form.get("username", "") or "").strip()
                    with conn.cursor() as cur:
                        if user_identifier.isdigit():
                            cur.execute(
                                """
                                SELECT userid
                                FROM users
                                WHERE userid = %s
                                   OR LOWER(username) = LOWER(%s)
                                   OR LOWER(email) = LOWER(%s)
                                LIMIT 1
                                """,
                                (int(user_identifier), user_identifier, user_identifier),
                            )
                        else:
                            cur.execute(
                                """
                                SELECT userid
                                FROM users
                                WHERE LOWER(username) = LOWER(%s)
                                   OR LOWER(email) = LOWER(%s)
                                LIMIT 1
                                """,
                                (user_identifier, user_identifier),
                            )
                        exists = cur.fetchone()
                    return "Account Found!" if exists else "Account Not Found! Please create your account."

                raise Exception("Error: One or more form fields are missing.")

            return ""
        except Exception as exc:
            return str(exc) + "\n"
        finally:
            if conn is not None:
                conn.close()

