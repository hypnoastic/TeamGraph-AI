import smtplib
import os
from email.message import EmailMessage

from config import settings

class EmailService:
    def __init__(self):
        self.smtp_user = os.environ.get("GMAIL_SMTP_USER")
        self.smtp_password = os.environ.get("GMAIL_SMTP_PASSWORD")

    def send_invitation_email(self, to_email: str, invite_url: str, role: str):
        message = EmailMessage()
        
        html_content = f"""
        <html>
          <body>
            <h2>You've been invited to join TeamGraph!</h2>
            <p>You have been invited to join a TeamGraph organization as a <strong>{role}</strong>.</p>
            <p>Click the link below to accept the invitation and set up your account:</p>
            <a href="{invite_url}" style="display:inline-block;padding:10px 20px;background-color:#000;color:#fff;text-decoration:none;border-radius:5px;">Accept Invitation</a>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p>{invite_url}</p>
          </body>
        </html>
        """

        message.set_content("Please enable HTML to view this email.")
        message.add_alternative(html_content, subtype='html')
        message["To"] = to_email
        message["From"] = self.smtp_user or "no-reply@teamgraph.local"
        message["Subject"] = "You're invited to TeamGraph"

        if self.smtp_user and self.smtp_password:
            try:
                with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(message)
                print(f"SMTP Email sent to {to_email}")
                return True
            except Exception as e:
                print(f"SMTP error: {e}")
                return False

        print(f"Mock Email sent to {to_email}. Role: {role}. URL: {invite_url}")
        return False

email_service = EmailService()
