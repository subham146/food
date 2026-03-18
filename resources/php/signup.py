import hmac
import random
import traceback

from flask import request, session
from werkzeug.security import generate_password_hash

from common import clean
from db import get_connection
from db_init import initialize_schema
from mailer import send_html_mail


def generate_unique_userid(conn) -> int:
    userid = random.randint(100000, 999999)
    tries = 0
    while tries < 25:
        with conn.cursor() as cur:
            cur.execute("SELECT userid FROM users WHERE userid = %s", (userid,))
            row = cur.fetchone()
        if not row:
            return userid
        userid = random.randint(100000, 999999)
        tries += 1
    return random.randint(100000, 999999)


def register_routes(app):
    @app.route("/resources/php/signup.py", methods=["POST"])
    def signup_php():
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)

            if request.method == "POST":
                form = request.form

                if "name" in form and "email" in form and "pwd2" in form:
                    username = clean(form.get("name", ""))
                    email = clean(form.get("email", ""))
                    password = clean(form.get("pwd2", ""))

                    session["username"] = username
                    session["email"] = email
                    session["password"] = password

                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT userid FROM users WHERE username = %s OR email = %s",
                            (username, email),
                        )
                        exists = cur.fetchone()

                    if exists:
                        return "Username or Email is already taken. Please choose a different one."

                    otppt = str(random.randint(0, 999999)).zfill(6)
                    subject = "Signup to Foodelight"
                    body = (
                        "Hi "
                        + username
                        + ",<br><br>Your OTP for Signing Up is: "
                        + otppt
                        + "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to create your account.<br><br>Thanks,<br>Foodelight"
                    )
                    sent, error = send_html_mail(email, subject, body)
                    if sent:
                        session["signup_otp"] = otppt
                        session["signup_otp_expires_at"] = int(__import__("time").time()) + 120
                        session["signup_otp_verified"] = False
                        return "OTP has been sent to your email"

                    return "ERROR sending OTP email." if not error else "Message could not be sent. Mailer Error: " + error

                if "otp" in form:
                    try:
                        username = session.get("username")
                        email = session.get("email")
                        expected_otp = session.get("signup_otp")
                        expires_at = session.get("signup_otp_expires_at")

                        if not username or not email or not expected_otp or not expires_at:
                            raise Exception("Session expired or invalid. Please try again.")

                        if int(__import__("time").time()) > int(expires_at):
                            return "Invalid OTP!"

                        entered_otp = (form.get("otp", "") or "").strip()

                        if hmac.compare_digest(str(expected_otp).strip(), entered_otp):
                            session["signup_otp_verified"] = True
                            return "OTP verified"

                        return "Invalid OTP!"
                    except Exception as exc:
                        try:
                            conn.rollback()
                        except Exception:
                            pass
                        return "Error: " + str(exc)

                if "create_account" in form:
                    try:
                        username = session.get("username")
                        email = session.get("email")
                        password = session.get("password")
                        otp_verified = session.get("signup_otp_verified", False)

                        if not username or not email or not password or not otp_verified:
                            raise Exception("Session expired or invalid. Please try again.")

                        with conn.cursor() as cur:
                            cur.execute("SELECT userid FROM users WHERE username = %s OR email = %s", (username, email))
                            exists = cur.fetchone()

                        if exists:
                            return "Username or Email is already taken. Please choose a different one."

                        hashed_password = generate_password_hash(password)
                        user_id = generate_unique_userid(conn)
                        gender = "other"
                        response_text = "UserID has been sent to your email"

                        with conn.cursor() as cur:
                            cur.execute(
                                "INSERT INTO users (userid, username, email, password, gender) VALUES (%s, %s, %s, %s, %s)",
                                (user_id, username, email, hashed_password, gender),
                            )

                        subject = "Foodelight details"
                        body = (
                            "Hi "
                            + username
                            + ",<br><br>Your UserID for Foodelight: "
                            + str(user_id)
                            + "<br><br>UserID can be referenced in the future.<br><br>Thanks,<br>Foodelight"
                        )
                        sent, error = send_html_mail(email, subject, body)
                        if not sent:
                            response_text = "ERROR sending UserID email." if not error else "Message could not be sent. Mailer Error: " + error

                        with conn.cursor() as cur:
                            cur.execute(
                                "INSERT INTO activity_log (userid, event) VALUES (%s, %s)",
                                (user_id, "Signup to Foodelight"),
                            )

                        conn.commit()
                        session.pop("signup_otp", None)
                        session.pop("signup_otp_expires_at", None)
                        session.pop("signup_otp_verified", None)
                        return response_text
                    except Exception as exc:
                        try:
                            conn.rollback()
                        except Exception:
                            pass
                        return "Error: " + str(exc)

                if "resend_signup_otp" in form:
                    username = session.get("username")
                    email = session.get("email")

                    if not username or not email:
                        return "Session expired or invalid. Please try again."

                    otppt = str(random.randint(0, 999999)).zfill(6)
                    subject = "Signup to Foodelight"
                    body = (
                        "Hi "
                        + username
                        + ",<br><br>Your OTP for Signing Up is: "
                        + otppt
                        + "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP to create your account.<br><br>Thanks,<br>Foodelight"
                    )
                    sent, error = send_html_mail(email, subject, body)
                    if sent:
                        session["signup_otp"] = otppt
                        session["signup_otp_expires_at"] = int(__import__("time").time()) + 120
                        session["signup_otp_verified"] = False
                        return "OTP has been sent to your email"

                    return "ERROR sending OTP email." if not error else "Message could not be sent. Mailer Error: " + error

                if "name" in form:
                    username = clean(form.get("name", ""))
                    with conn.cursor() as cur:
                        cur.execute("SELECT userid FROM users WHERE username = %s", (username,))
                        exists = cur.fetchone()
                    if exists:
                        return "Username already taken. Please choose a different one."
                    return "Username available."

                raise Exception("Error: One or more form fields are missing2.")

            return ""
        except Exception as exc:
            return str(exc) + "\n"
        finally:
            if conn is not None:
                conn.close()

