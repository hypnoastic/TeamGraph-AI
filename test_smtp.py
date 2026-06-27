from dotenv import load_dotenv
load_dotenv()

from apps.api.services.email import email_service
import os

print(f"SMTP User: {email_service.smtp_user}")
print(f"SMTP Pass: {email_service.smtp_password}")
success = email_service.send_invitation_email(
    to_email="collabx2315@gmail.com",
    invite_url="http://example.com",
    role="member"
)
print(f"Success: {success}")
