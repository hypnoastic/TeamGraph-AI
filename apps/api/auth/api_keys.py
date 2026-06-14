import hashlib
import secrets


def generate_api_key() -> tuple[str, str, str]:
    raw_key = f"tg_{secrets.token_urlsafe(32)}"
    key_hash = hash_api_key(raw_key)
    prefix = raw_key[:8]
    return raw_key, key_hash, prefix


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


def validate_scopes(requested_scopes: list[str], allowed_scopes: list[str]) -> bool:
    if "*" in allowed_scopes:
        return True
    return all(scope in allowed_scopes for scope in requested_scopes)


def has_scope(required_scope: str, granted_scopes: list[str]) -> bool:
    if "*" in granted_scopes:
        return True
    return required_scope in granted_scopes
