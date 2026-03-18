from flask import jsonify, session


def register_routes(app):
    @app.route("/resources/php/logout.py", methods=["GET", "POST"])
    def logout_php():
        session.clear()
        return jsonify({"ok": True, "redirect": "login.html"})

