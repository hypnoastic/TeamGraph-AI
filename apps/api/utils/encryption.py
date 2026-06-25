import base64
from cryptography.fernet import Fernet
from config import settings

def _get_fernet() -> Fernet:
    # Ensure the key is 32 URL-safe base64-encoded bytes
    key = settings.encryption_key
    if len(key) != 44:
        # Fallback to a valid default for local testing if the provided key is invalid
        key = "cK6m18qgO-bN9Fh-21iPZQJ04x_U-_z4i8_M-_Q_lP8="
    return Fernet(key.encode("utf-8"))

def encrypt_token(token: str | None) -> str | None:
    if not token:
        return None
    fernet = _get_fernet()
    return fernet.encrypt(token.encode("utf-8")).decode("utf-8")

def decrypt_token(encrypted_token: str | None) -> str | None:
    if not encrypted_token:
        return None
    fernet = _get_fernet()
    return fernet.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
