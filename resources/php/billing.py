import os
import random
from datetime import date, datetime, timedelta, timezone

from flask import request, session

from common import parse_duration_days
from db import get_connection
from db_init import initialize_schema
from mailer import send_html_mail


def register_routes(app):
    @app.route("/resources/php/billing.py", methods=["POST"])
    def billing_php():
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)

            if request.method == "POST":
                form = request.form

                if all(
                    k in form
                    for k in [
                        "paymentData",
                        "fullName",
                        "phoneNumber",
                        "streetAddress",
                        "city",
                        "state",
                        "pinCode",
                    ]
                ):
                    username = session.get("username")
                    email = session.get("email")
                    userid = session.get("userId")
                    if not userid:
                        raise Exception("Not logged in.")

                    otppt = str(random.randint(0, 999999)).zfill(6)
                    body = (
                        "Hi "
                        + str(username)
                        + ",<br><br>Your OTP for Payment is: "
                        + otppt
                        + "<br><br>This OTP is valid for 2 minutes only.<br><br>Please use this OTP for successful payment to the Foodelight.<br><br>Thanks,<br>Foodelight"
                    )
                    sent, error = send_html_mail(str(email), "Payment Authentication", body)
                    if sent:
                        expires_at = datetime.now(timezone.utc) + timedelta(minutes=2)
                        with conn.cursor() as cur:
                            cur.execute(
                                "INSERT INTO otp (userid, otp, expires_at, is_used) VALUES (%s, %s, %s, %s)",
                                (userid, otppt, expires_at, 0),
                            )
                        conn.commit()
                        return "OTP has been sent to your email"

                    return "ERROR" if not error else "Message could not be sent. Mailer Error: " + error

                if "otp" in form:
                    try:
                        username = session.get("username")
                        email = session.get("email")
                        goal = session.get("goal")
                        gender = session.get("gender")
                        days = session.get("days")
                        meal = session.get("meal")
                        diet = session.get("diet")
                        _sty = session.get("sty")
                        choose = session.get("choose")
                        price = session.get("tp")
                        userid = session.get("userId")

                        transaction_id = os.urandom(8).hex()[:16]
                        duration_days = parse_duration_days(str(days))

                        otp_input = (form.get("otp", "") or "").strip()

                        with conn.cursor() as cur:
                            cur.execute(
                                "SELECT id, expires_at FROM otp WHERE userid = %s AND otp = %s AND is_used = 0",
                                (userid, otp_input),
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

                            conn.begin()
                            with conn.cursor() as cur:
                                cur.execute("UPDATE otp SET is_used = 1 WHERE id = %s", (otp_row.get("id"),))

                            plan_goal = str(goal)
                            plan_diet = str(diet)
                            plan_mealtype = str(choose)
                            plan_price = float(price)

                            plan_id = None
                            with conn.cursor() as cur:
                                cur.execute(
                                    "SELECT planid FROM plans WHERE goal = %s AND diet = %s AND mealtype = %s AND duration_days = %s AND price = %s LIMIT 1",
                                    (plan_goal, plan_diet, plan_mealtype, duration_days, plan_price),
                                )
                                row = cur.fetchone()
                                if row:
                                    plan_id = row.get("planid")

                            if not plan_id:
                                with conn.cursor() as cur:
                                    cur.execute(
                                        "INSERT INTO plans (goal, diet, mealtype, duration_days, price) VALUES (%s, %s, %s, %s, %s)",
                                        (plan_goal, plan_diet, plan_mealtype, duration_days, plan_price),
                                    )
                                    plan_id = cur.lastrowid

                                meal_names = [m.strip() for m in str(meal).split(",") if m.strip()]
                                for meal_name in meal_names:
                                    meal_id = None
                                    with conn.cursor() as cur:
                                        cur.execute("SELECT mealid FROM meals WHERE meal_name = %s LIMIT 1", (meal_name,))
                                        meal_row = cur.fetchone()
                                        if meal_row:
                                            meal_id = meal_row.get("mealid")

                                    if not meal_id:
                                        with conn.cursor() as cur:
                                            cur.execute("INSERT INTO meals (meal_name) VALUES (%s)", (meal_name,))
                                            meal_id = cur.lastrowid

                                    with conn.cursor() as cur:
                                        cur.execute(
                                            "INSERT IGNORE INTO plan_meals (planid, mealid) VALUES (%s, %s)",
                                            (plan_id, meal_id),
                                        )

                            if gender:
                                gender_value = str(gender).lower()
                                if gender_value not in ["male", "female", "other"]:
                                    gender_value = "other"
                                with conn.cursor() as cur:
                                    cur.execute("UPDATE users SET gender = %s WHERE userid = %s", (gender_value, userid))

                            start_date = date.today()
                            end_date = start_date + timedelta(days=duration_days)
                            status = "active"

                            with conn.cursor() as cur:
                                cur.execute(
                                    "INSERT INTO subscriptions (userid, planid, start_date, end_date, status) VALUES (%s, %s, %s, %s, %s)",
                                    (userid, plan_id, start_date, end_date, status),
                                )
                                subscription_id = cur.lastrowid

                            with conn.cursor() as cur:
                                cur.execute(
                                    "INSERT INTO transactions (transactionid, subscriptionid, amount, payment_method, payment_status) VALUES (%s, %s, %s, %s, %s)",
                                    (transaction_id, subscription_id, plan_price, "otp", "success"),
                                )

                            with conn.cursor() as cur:
                                cur.execute(
                                    "INSERT INTO activity_log (userid, event) VALUES (%s, %s)",
                                    (userid, "Subscribed to Foodelight"),
                                )

                            conn.commit()

                            body = (
                                "Hi "
                                + str(username)
                                + ", <br><br>Your Transaction Id is "
                                + transaction_id
                                + " and Subscription ID is "
                                + str(subscription_id)
                                + " for your subscription plan.<br><br>Thanks,<br>Foodelight"
                            )
                            send_html_mail(str(email), "Welcome to Foodelight", body)

                            return "Your Order Successfully Placed"

                        return "Invalid OTP!"
                    except Exception as exc:
                        try:
                            conn.rollback()
                        except Exception:
                            pass
                        return "Error: " + str(exc)

                raise Exception("Error: One or more form fields are missing.")

            return ""
        except Exception as exc:
            return str(exc) + "\n"
        finally:
            if conn is not None:
                conn.close()

