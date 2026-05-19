from flask import jsonify, session

from common import format_pst_to_ist
from db import get_connection
from db_init import initialize_schema


def register_routes(app):
    @app.route("/python/admin.py", methods=["GET"])
    def admin_php():
        current_user = session.get("username", "Guest")
        conn = None
        try:
            conn = get_connection()
            initialize_schema(conn)

            metrics = {"newOrders": 0, "users": 0, "totalSales": 0}
            recent_orders = []

            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS total FROM users")
                row = cur.fetchone()
                metrics["users"] = int((row or {}).get("total", 0) or 0)

                cur.execute("SELECT COUNT(*) AS total FROM subscriptions")
                row = cur.fetchone()
                metrics["newOrders"] = int((row or {}).get("total", 0) or 0)

                cur.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions")
                row = cur.fetchone()
                metrics["totalSales"] = float((row or {}).get("total", 0) or 0)

                cur.execute(
                    """
                    SELECT
                        u.username AS username,
                        s.subscriptionid AS subscriptionid,
                        t.transactionid AS transactionid,
                        t.amount AS amount,
                        COALESCE(t.paid_at, s.start_date) AS datein
                    FROM subscriptions s
                    JOIN users u ON u.userid = s.userid
                    LEFT JOIN transactions t ON t.subscriptionid = s.subscriptionid
                    ORDER BY datein DESC
                    """
                )
                rows = cur.fetchall() or []

            for row in rows:
                recent_orders.append(
                    {
                        "username": row.get("username", ""),
                        "subscriptionid": row.get("subscriptionid", ""),
                        "transactionid": row.get("transactionid", ""),
                        "amount": row.get("amount", ""),
                        "datein": format_pst_to_ist(row.get("datein", "")),
                    }
                )

            return jsonify(
                {
                    "currentUser": current_user,
                    "metrics": metrics,
                    "recentOrders": recent_orders,
                }
            )
        except Exception:
            return jsonify({"error": "Connection failed"}), 500
        finally:
            if conn is not None:
                conn.close()

