import os


def fdl_env_smtp(key: str, default: str = "") -> str:
    value = os.getenv(key)
    if value is None or value == "":
        return default
    return value


smtphost = fdl_env_smtp("FOODELIGHT_SMTP_HOST", "smtp.gmail.com")
smtpport = int(fdl_env_smtp("FOODELIGHT_SMTP_PORT", "587"))
smtpusername = fdl_env_smtp("FOODELIGHT_SMTP_USER", "nileriver6630@gmail.com")
smtppassword = fdl_env_smtp("FOODELIGHT_SMTP_PASS", "sgin okvy aqdx ehwu")

if smtpport <= 0:
    smtpport = 587
