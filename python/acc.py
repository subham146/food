from flask import jsonify, session


def register_routes(app):
    @app.route("/python/acc.py", methods=["GET", "POST"])
    def acc_php():
        return jsonify(
            {
                "userId": session.get("userId", ""),
                "username": session.get("username", ""),
                "email": session.get("email", ""),
            }
        )

