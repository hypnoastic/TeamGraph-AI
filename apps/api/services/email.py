import base64
from email.message import EmailMessage

import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import settings

class EmailService:
    def __init__(self):
        try:
            self.credentials, self.project_id = google.auth.default(
                scopes=["https://www.googleapis.com/auth/gmail.send"]
            )
            self.service = build('gmail', 'v1', credentials=self.credentials)
        except Exception as e:
            print(f"Warning: Failed to initialize Google credentials for EmailService. {e}")
            self.service = None

    def send_invitation_email(self, to_email: str, invite_url: str, role: str):
        if not self.service:
            print(f"Mock Email sent to {to_email}. Role: {role}. URL: {invite_url}")
            return False

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
        message["From"] = "no-reply@teamgraph.local"
        message["Subject"] = "You're invited to TeamGraph"

        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        create_message = {"raw": encoded_message}

        try:
            send_message = (
                self.service.users()
                .messages()
                .send(userId="me", body=create_message)
                .execute()
            )
            print(f'Message Id: {send_message["id"]}')
            return True
        except HttpError as error:
            print(f"An error occurred sending email: {error}")
            return False

email_service = EmailService()
