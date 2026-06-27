import uvicorn
from dotenv import load_dotenv

load_dotenv("../../.env")
uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
