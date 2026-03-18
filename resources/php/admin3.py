from flask import jsonify, session

from db import get_connection
from db_init import initialize_schema


def register_routes(app):
    @app.route("/resources/php/admin3.py", methods=["GET"])
    def admin3_php():
        current_user = session.get("username", "Guest")
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)
            subscriptions = []

            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        s.userid AS userid,
                        p.goal AS goal,
                        p.duration_days AS duration_days,
                        GROUP_CONCAT(m.meal_name ORDER BY m.meal_name SEPARATOR ', ') AS meals_list,
                        p.diet AS diet,
                        '' AS type,
                        p.mealtype AS mealtype,
                        s.subscriptionid AS subscriptionid,
                        t.transactionid AS transactionid,
                        t.amount AS amount,
                        COALESCE(t.paid_at, s.start_date) AS datein
                    FROM subscriptions s
                    JOIN plans p ON p.planid = s.planid
                    LEFT JOIN plan_meals pm ON pm.planid = p.planid
                    LEFT JOIN meals m ON m.mealid = pm.mealid
                    LEFT JOIN transactions t ON t.subscriptionid = s.subscriptionid
                    GROUP BY
                        s.subscriptionid,
                        s.userid,
                        p.goal,
                        p.duration_days,
                        p.diet,
                        p.mealtype,
                        t.transactionid,
                        t.amount,
                        t.paid_at,
                        s.start_date
                    ORDER BY datein DESC
                    """
                )
                rows = cur.fetchall() or []

            for row in rows:
                subscriptions.append(
                    {
                        "userid": row.get("userid", ""),
                        "goal": row.get("goal", ""),
                        "duration": str(row.get("duration_days", "")) if row.get("duration_days") is not None else "",
                        "meals": row.get("meals_list", "") or "",
                        "diet": row.get("diet", ""),
                        "type": row.get("type", ""),
                        "mealtype": row.get("mealtype", ""),
                        "subscriptionid": row.get("subscriptionid", ""),
                        "transactionid": row.get("transactionid", ""),
                        "amount": row.get("amount", ""),
                        "datein": row.get("datein", ""),
                    }
                )

            return jsonify({"currentUser": current_user, "subscriptions": subscriptions})
        except Exception:
            return jsonify({"error": "Connection failed"}), 500
        finally:
            if conn is not None:
                conn.close()

