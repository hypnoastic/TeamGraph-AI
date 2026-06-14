from fastapi import Depends, HTTPException, Header
from typing import Optional

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    
    if token == "demo_admin_token":
        return {"id": "usr_admin", "email": "admin@teamgraph.local", "role": "admin"}
    elif token == "demo_member_token":
        return {"id": "usr_member", "email": "member@teamgraph.local", "role": "member"}
    else:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
