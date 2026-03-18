import os

from flask import Flask, abort, send_from_directory

import acc
import admin
import admin2
import admin3
import admin4
import billing
import change
import change2
import delete
import forgot
import forgot2
import index2
import index3
import login
import login2
import logout
import logout2
import plan
import signup
from db_init import initialize_schema


app = Flask(__name__)
app.secret_key = os.getenv("FOODELIGHT_SECRET_KEY", "foodelight-secret-key")
SITE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

initialize_schema()

signup.register_routes(app)
login.register_routes(app)
acc.register_routes(app)
admin.register_routes(app)
admin2.register_routes(app)
admin3.register_routes(app)
admin4.register_routes(app)
forgot.register_routes(app)
forgot2.register_routes(app)
change.register_routes(app)
change2.register_routes(app)
logout.register_routes(app)
logout2.register_routes(app)
index2.register_routes(app)
index3.register_routes(app)
billing.register_routes(app)
plan.register_routes(app)
delete.register_routes(app)
login2.register_routes(app)


@app.route("/", methods=["GET"])
def serve_home():
    return send_from_directory(SITE_ROOT, "index.html")


@app.route("/<path:path>", methods=["GET"])
def serve_frontend(path):
    full_path = os.path.abspath(os.path.join(SITE_ROOT, path))
    if not full_path.startswith(SITE_ROOT):
        abort(404)
    if not os.path.exists(full_path):
        abort(404)
    return send_from_directory(SITE_ROOT, path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
