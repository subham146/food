from flask import jsonify, session

from common import format_pst_to_ist
from db import get_connection
from db_init import initialize_schema


def register_routes(app):
    @app.route("/python/plan.py", methods=["GET"])
    def plan_php():
        if not session.get("username"):
            return jsonify({"error": "Not logged in"}), 401

        current_user = session.get("username")
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)
            transactions = []

            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT t.transactionid, COALESCE(t.paid_at, s.start_date) AS datein, t.amount
                    FROM users u
                    JOIN subscriptions s ON s.userid = u.userid
                    LEFT JOIN transactions t ON t.subscriptionid = s.subscriptionid
                    WHERE u.username = %s
                    ORDER BY datein DESC
                    """,
                    (current_user,),
                )
                rows = cur.fetchall() or []

            for row in rows:
                if row.get("transactionid") is None:
                    continue
                transactions.append(
                    {
                        "transactionid": row.get("transactionid"),
                        "date": format_pst_to_ist(row.get("datein")),
                        "name": current_user,
                        "amount": float(row.get("amount") or 0),
                        "status": "Success",
                    }
                )

            return jsonify({"currentUser": current_user, "transactions": transactions})
        except Exception:
            return jsonify({"error": "Connection failed"}), 500
        finally:
            if conn is not None:
                conn.close()

