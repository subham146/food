from flask import jsonify, session


def register_routes(app):
    @app.route("/python/index3.py", methods=["GET"])
    def index3_php():
        days = session.get("days")
        price = session.get("price")

        if days is None or price is None:
            return jsonify({"error": "Missing subscription details in session"}), 400

        price = float(price)
        if days == "4w":
            discount = price * 0.1
            days_label = "4 weeks"
        elif days == "2w":
            discount = price * 0.03
            days_label = "2 weeks"
        else:
            discount = price * 0.1
            days_label = "3 days"

        gst = price * 0.05
        cgst = gst / 2
        sgst = gst / 2
        total_amount = price + cgst + sgst - discount

        session["tp"] = total_amount

        return jsonify(
            {
                "price": price,
                "days": days,
                "daysLabel": days_label,
                "sgst": sgst,
                "cgst": cgst,
                "discount": discount,
                "totalAmount": total_amount,
            }
        )

