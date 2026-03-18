import os


def fdl_env(key: str, default: str = "") -> str:
    value = os.getenv(key)
    if value is None or value == "":
        return default
    return value


servername = fdl_env("FOODELIGHT_DB_HOST", "sql12.freesqldatabase.com")
username = fdl_env("FOODELIGHT_DB_USER", "sql12820417")
password = fdl_env("FOODELIGHT_DB_PASS", "axIpXwNA1M")
dbname = fdl_env("FOODELIGHT_DB_NAME", "sql12820417")
