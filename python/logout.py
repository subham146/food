from flask import jsonify, session


def register_routes(app):
    @app.route("/python/logout.py", methods=["GET", "POST"])
    def logout_php():
        session.clear()
        return jsonify({"ok": True, "redirect": "login.html"})

