import random
from datetime import datetime, timedelta, timezone

from flask import request, session

from common import clean
from db import get_connection
from db_init import initialize_schema
from mailer import send_html_mail


def register_routes(app):
    @app.route("/resources/php/forgot.py", methods=["POST"])
    def forgot_php():
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)

            if request.method == "POST":
                form = request.form

                if "email" in form:
                    emailpt = clean(form.get("email", ""))
                    with conn.cursor() as cur:
                        cur.execute("SELECT userid, username, email FROM users WHERE email = %s", (emailpt,))
                        row = cur.fetchone()

                    if row:
                        user_id = row.get("userid")
                        username = row.get("username", "")
                        email = row.get("email", "")
                        session["userid"] = user_id
                        session["email"] = email

                        otppt = str(random.randint(0, 999999)).zfill(6)
                        body = (
                            "Hi "
                            + username
                            + ",<br><br>Your OTP for password reset is: "
                            + otppt
                            + "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to reset your password.<br><br>Thanks,<br>Foodelight"
                        )
                        sent, error = send_html_mail(emailpt, "Reset Password", body)
                        if sent:
                            expires_at = datetime.now(timezone.utc) + timedelta(minutes=2)
                            with conn.cursor() as cur:
                                cur.execute(
                                    "INSERT INTO otp(userid, otp, expires_at, is_used) VALUES (%s, %s, %s, %s)",
                                    (user_id, otppt, expires_at, 0),
                                )
                            conn.commit()
                            return "OTP has been sent to your email"
                        return "ERROR sending OTP email." if not error else "Message could not be sent. Mailer Error: " + error

                    return "Account not Found!"

                if "otp" in form:
                    userid = session.get("userid")
                    otp = (form.get("otp", "") or "").strip()
                    if not userid:
                        raise Exception("Session expired or invalid. Please try again.")

                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT id, expires_at FROM otp WHERE userid = %s AND otp = %s AND is_used = 0",
                            (userid, otp),
                        )
                        row = cur.fetchone()

                    if row:
                        expires_at = row.get("expires_at")
                        if expires_at is None:
                            return "Invalid OTP!"
                        if expires_at.tzinfo is None:
                            expires_at = expires_at.replace(tzinfo=timezone.utc)
                        if datetime.now(timezone.utc) > expires_at:
                            return "OTP expired!"

                        with conn.cursor() as cur:
                            cur.execute("UPDATE otp SET is_used = 1 WHERE id = %s", (row.get("id"),))
                        conn.commit()
                        return "OTP is valid."

                    return "Invalid OTP!"

                raise Exception("Error: One or more form fields are missing.")

            return ""
        except Exception as exc:
            return str(exc) + "\n"
        finally:
            if conn is not None:
                conn.close()

