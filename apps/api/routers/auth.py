from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    domain: str

class LoginResponse(BaseModel):
    token: str
    user: dict

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    if request.domain != "acme.local":
        raise HTTPException(status_code=401, detail="Invalid domain")
        
    if request.email == "admin@teamgraph.local":
        return {
            "token": "demo_admin_token",
            "user": {"id": "usr_admin", "email": request.email, "role": "admin"}
        }
    elif request.email == "member@teamgraph.local":
        return {
            "token": "demo_member_token",
            "user": {"id": "usr_member", "email": request.email, "role": "member"}
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")
