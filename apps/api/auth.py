import os
import jwt
from fastapi import Depends, HTTPException, Header
from jwt import PyJWKClient

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/keys"
jwks = PyJWKClient(JWKS_URL) if SUPABASE_URL else None

from typing import Optional

def verify_bearer_token(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    
    if not jwks:
        raise HTTPException(status_code=500, detail="auth not configured")
    
    token = authorization.split()[1]
    try:
        key = jwks.get_signing_key_from_jwt(token).key
        claims = jwt.decode(token, key, algorithms=["RS256"], options={"verify_aud": False})
        return claims  # includes 'sub'
    except Exception:
        raise HTTPException(status_code=401, detail="invalid token")
