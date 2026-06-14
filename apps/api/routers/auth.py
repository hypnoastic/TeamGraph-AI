from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from auth.demo_auth import get_current_user


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
            "user": get_current_user("Bearer demo_admin_token"),
        }

    if request.email == "member@teamgraph.local":
        return {
            "token": "demo_member_token",
            "user": get_current_user("Bearer demo_member_token"),
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")
