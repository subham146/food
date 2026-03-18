from flask import jsonify, session


def register_routes(app):
    @app.route("/resources/php/logout2.py", methods=["GET", "POST"])
    def logout2_php():
        session.clear()
        return jsonify({"ok": True, "redirect": "index.html"})

