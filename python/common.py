import html
import re
from datetime import date, datetime, timedelta, timezone

PST = timezone(timedelta(hours=-8))
IST = timezone(timedelta(hours=5, minutes=30))
PST_TO_IST_DELTA = timedelta(hours=13, minutes=30)


def clean(value: str) -> str:
    return html.escape((value or "").strip(), quote=True)


def now_ist() -> datetime:
    return datetime.now(IST)


def now_pst_naive() -> datetime:
    # Store as naive DATETIME while treating the source as PST.
    return datetime.now(PST).replace(tzinfo=None)


def pst_value_to_ist(value):
    if not value:
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            # Requirement: treat DB values as PST and convert to IST by +13:30.
            return (value + PST_TO_IST_DELTA).replace(tzinfo=IST)
        return value.astimezone(IST)

    if isinstance(value, date):
        return datetime(value.year, value.month, value.day, tzinfo=IST)

    return None


def format_pst_to_ist(value, fmt: str = "%Y-%m-%d %I:%M:%S %p IST") -> str:
    dt_ist = pst_value_to_ist(value)
    if not dt_ist:
        return ""
    return dt_ist.strftime(fmt)


def is_expired_pst_value(expires_at) -> bool:
    dt_ist = pst_value_to_ist(expires_at)
    if not dt_ist:
        return True
    return now_ist() > dt_ist


def now_plus_seconds(seconds: int) -> str:
    return (now_ist() + timedelta(seconds=seconds)).strftime("%Y-%m-%d %H:%M:%S")


def parse_duration_days(raw: str) -> int:
    raw = (raw or "").strip()
    if raw == "":
        return 3

    match_days = re.match(r"^(\d+)\s*d$", raw, flags=re.IGNORECASE)
    if match_days:
        return max(1, int(match_days.group(1)))

    match_weeks = re.match(r"^(\d+)\s*w$", raw, flags=re.IGNORECASE)
    if match_weeks:
        return max(1, int(match_weeks.group(1))) * 7

    if raw.isdigit():
        return max(1, int(raw))

    if raw == "4w":
        return 28
    if raw == "2w":
        return 14
    if raw == "3d":
        return 3

    return 3
