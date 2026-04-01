"""
Email Service — sends PDF reports via aiosmtplib.
"""
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from ..config import settings

EMAIL_BODY = """\
<html>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: #0a0f1a; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #00d4ff; margin: 0; font-size: 24px;">SalesIQ Report</h1>
    <p style="color: #94a3b8; margin: 8px 0 0;">AI Sales Intelligence Platform</p>
  </div>
  <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Hi,</p>
    <p>Please find attached the full AI sales call analysis report for:</p>
    <ul>
      <li><strong>Prospect:</strong> {prospect_name}</li>
      <li><strong>Company:</strong> {company}</li>
      <li><strong>Rep:</strong> {rep_name}</li>
      <li><strong>Score:</strong> {score}/100</li>
      <li><strong>Verdict:</strong> {verdict}</li>
    </ul>
    <p>The report includes:</p>
    <ul>
      <li>Call summary and classification</li>
      <li>Minute-by-minute sentiment analysis</li>
      <li>Failure point diagnostics with coaching responses</li>
      <li>Pre-call briefing for re-engaging this prospect</li>
      <li>Full transcript appendix</li>
    </ul>
    <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
      Sent by SalesIQ — AI Sales Intelligence Platform
    </p>
  </div>
</body>
</html>
"""

async def send_report_email(
    to_email:  str,
    pdf_bytes: bytes,
    call:      dict,
    analysis:  dict,
):
    """Send the PDF report to the given email address."""
    if not settings.smtp_username:
        raise ValueError("SMTP not configured. Set SMTP_HOST, SMTP_USERNAME and SMTP_PASSWORD in settings.")

    a = analysis or {}
    c = call or {}

    # Build message
    msg = MIMEMultipart("mixed")
    msg["From"]    = f"{settings.smtp_from_name} <{settings.smtp_username}>"
    msg["To"]      = to_email
    msg["Subject"] = f"SalesIQ Report — {c.get('prospect_name','Unknown')} @ {c.get('company','Unknown')}"

    # HTML body
    body_html = EMAIL_BODY.format(
        prospect_name = c.get("prospect_name") or "—",
        company       = c.get("company") or "—",
        rep_name      = c.get("rep_name") or "—",
        score         = round(a.get("overall_score") or 0),
        verdict       = a.get("verdict") or "—",
    )
    msg.attach(MIMEText(body_html, "html"))

    # PDF attachment
    part = MIMEBase("application", "pdf")
    part.set_payload(pdf_bytes)
    encoders.encode_base64(part)
    filename = f"SalesIQ_Report_{c.get('prospect_name','unknown').replace(' ','_')}.pdf"
    part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
    msg.attach(part)

    # Send
    await aiosmtplib.send(
        msg,
        hostname    = settings.smtp_host,
        port        = settings.smtp_port,
        username    = settings.smtp_username,
        password    = settings.smtp_password,
        start_tls   = True,
    )
