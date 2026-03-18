import random
import hmac
from datetime import datetime, timedelta, timezone

from flask import request, session
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_connection
from db_init import initialize_schema
from mailer import send_html_mail


def register_routes(app):
    @app.route("/resources/php/login2.py", methods=["POST"])
    def login2_php():
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)

            if request.method == "POST":
                form = request.form

                if "username" in form and "pwd" in form:
                    usernamept = (form.get("username", "") or "").strip()
                    passwordpt = (form.get("pwd", "") or "").strip()

                    if usernamept == "" or passwordpt == "":
                        return "Error: All fields are required."

                    with conn.cursor() as cur:
                        if usernamept.isdigit():
                            cur.execute(
                                """
                                SELECT adminid, username, password, email
                                FROM admin
                                WHERE LOWER(username) = LOWER(%s)
                                   OR LOWER(email) = LOWER(%s)
                                   OR adminid = %s
                                LIMIT 1
                                """,
                                (usernamept, usernamept, int(usernamept)),
                            )
                        else:
                            cur.execute(
                                """
                                SELECT adminid, username, password, email
                                FROM admin
                                WHERE LOWER(username) = LOWER(%s)
                                   OR LOWER(email) = LOWER(%s)
                                LIMIT 1
                                """,
                                (usernamept, usernamept),
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
                        adminid = row.get("adminid")
                        username = row.get("username", "")
                        email = row.get("email", "")

                        session["adminid"] = adminid
                        session["username"] = username
                        session["email"] = email

                        otppt = str(random.randint(0, 999999)).zfill(6)
                        body = (
                            "Hi "
                            + username
                            + ",<br><br>Your OTP for Login is: "
                            + otppt
                            + "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to login to Foodelight.<br><br>Thanks,<br>Foodelight"
                        )
                        sent, error = send_html_mail(email, "Login Authentication for Admin", body)
                        if sent:
                            expires_at = datetime.now(timezone.utc) + timedelta(minutes=2)
                            with conn.cursor() as cur:
                                cur.execute(
                                    "INSERT INTO admin_otp(adminid, otp, expires_at, is_used) VALUES (%s, %s, %s, %s)",
                                    (adminid, otppt, expires_at, 0),
                                )
                                # Upgrade legacy plain-text admin passwords after a successful login.
                                if used_legacy_plain:
                                    cur.execute(
                                        "UPDATE admin SET password = %s WHERE adminid = %s",
                                        (generate_password_hash(passwordpt), adminid),
                                    )
                            conn.commit()
                            return "OTP has been sent to your email"
                        return "ERROR" if not error else "Message could not be sent. Mailer Error: " + error

                    return "Invalid credentials"

                if "otp" in form:
                    try:
                        adminid = session.get("adminid")
                        if not adminid:
                            raise Exception("Admin ID missing from session.")
                        otp = (form.get("otp", "") or "").strip()

                        with conn.cursor() as cur:
                            cur.execute(
                                "SELECT id, expires_at FROM admin_otp WHERE adminid = %s AND otp = %s AND is_used = 0",
                                (adminid, otp),
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
                                cur.execute("UPDATE admin_otp SET is_used = 1 WHERE id = %s", (row.get("id"),))
                            conn.commit()
                            return "Admin Login Success"

                        return "Invalid OTP!"
                    except Exception as exc:
                        return "Error: " + str(exc)

                raise Exception("Error: One or more form fields are missing.")

            return ""
        except Exception as exc:
            return str(exc) + "\n"
        finally:
            if conn is not None:
                conn.close()

