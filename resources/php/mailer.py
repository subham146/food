import smtplib
from email.mime.text import MIMEText

from smtp import smtphost, smtpport, smtppassword, smtpusername


def send_html_mail(to_address: str, subject: str, html_body: str) -> tuple[bool, str]:
    msg = MIMEText(html_body, "html")
    msg["Subject"] = subject
    msg["From"] = smtpusername
    msg["To"] = to_address

    try:
        with smtplib.SMTP(smtphost, smtpport) as server:
            server.starttls()
            server.login(smtpusername, smtppassword)
            server.sendmail(smtpusername, [to_address], msg.as_string())
        return True, ""
    except Exception as exc:  # pragma: no cover
        return False, str(exc)
