from flask import request, session

from common import clean, parse_duration_days
from db import get_connection


def register_routes(app):
    @app.route("/python/index2.py", methods=["POST"])
    def index2_php():
        conn = None
        try:
            conn = get_connection()
            if request.method == "POST":
                form = request.form
                required = ["goal", "gender", "days", "meal", "diet", "sty"]
                has_choose = ("choose" in form) or ("choose[]" in form)
                if all(k in form for k in required) and has_choose:
                    goal = clean(form.get("goal", ""))
                    gender = clean(form.get("gender", ""))
                    days = clean(form.get("days", ""))
                    meal = clean(form.get("meal", ""))
                    diet = clean(form.get("diet", ""))
                    sty = clean(form.get("sty", ""))
                    price = form.get("price")
                    choose_values = form.getlist("choose")
                    if not choose_values:
                        choose_values = form.getlist("choose[]")
                    choose = [clean(v) for v in choose_values]
                    useridpt = session.get("userId")

                    choose_string = ", ".join(choose)
                    duration_days = parse_duration_days(days)

                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT subscriptionid FROM subscriptions WHERE userid = %s AND status = 'active' AND CURRENT_DATE <= end_date LIMIT 1",
                            (useridpt,),
                        )
                        row = cur.fetchone()

                    if row:
                        return "You already have an active subscription."

                    session["goal"] = goal
                    session["gender"] = gender
                    session["days"] = days
                    session["meal"] = meal
                    session["diet"] = diet
                    session["sty"] = sty
                    session["choose"] = choose_string
                    session["duration_days"] = duration_days
                    if price is not None and str(price).strip() != "":
                        session["price"] = price
                    return "Redirecting to payment Page..."

                if "price" in form:
                    session["price"] = form.get("price")
                    return ""

                raise Exception("Error: One or more form fields are missing.")
            return ""
        except Exception as exc:
            return str(exc) + "\n"
        finally:
            if conn is not None:
                conn.close()

