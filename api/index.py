import os
import sys
import importlib.util

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_APP_DIR = os.path.join(ROOT, "python")

if PYTHON_APP_DIR not in sys.path:
    sys.path.insert(0, PYTHON_APP_DIR)

APP_PATH = os.path.join(PYTHON_APP_DIR, "app.py")
_spec = importlib.util.spec_from_file_location("foodelight_app", APP_PATH)
_module = importlib.util.module_from_spec(_spec)
assert _spec is not None and _spec.loader is not None
_spec.loader.exec_module(_module)
app = _module.app
