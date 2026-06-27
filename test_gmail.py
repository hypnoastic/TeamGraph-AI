import base64
from email.message import EmailMessage
import google.auth
from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file(
    'teamgraph-sa.json', scopes=["https://www.googleapis.com/auth/gmail.send"]
)
service = build('gmail', 'v1', credentials=creds)
message = EmailMessage()
message.set_content("Test")
message["To"] = "yashkumar@gmail.com"
message["From"] = "teamgraph-emailer@teamgraph-500506.iam.gserviceaccount.com"
message["Subject"] = "Test"
encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
try:
    print(service.users().messages().send(userId="me", body={"raw": encoded}).execute())
except Exception as e:
    print("Error:", e)
