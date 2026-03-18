import html
import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


def clean(value: str) -> str:
    return html.escape((value or "").strip(), quote=True)


def now_ist() -> datetime:
    return datetime.now(IST)


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
