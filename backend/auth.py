import os
import httpx
from typing import Optional
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import config
from utils.logger import logger

security = HTTPBearer(auto_error=False)

_jwks_cache = None

def get_jwks(supabase_url: str):
    global _jwks_cache
    if not _jwks_cache:
        jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        try:
            response = httpx.get(jwks_url, timeout=5.0)
            if response.status_code == 200:
                _jwks_cache = response.json()
            else:
                raise Exception(f"Non-200 status code from JWKS endpoint: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to fetch JWKS from Supabase: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch JWKS from Supabase: {str(e)}"
            )
    return _jwks_cache

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    # 1. Check Demo Mode Authentication
    if config.AUTH_MODE == "demo":
        if credentials and credentials.credentials.startswith("demo-token-"):
            user_id = credentials.credentials.replace("demo-token-", "")
            print("AUTH USER:", user_id)
            logger.info(f"Authenticated demo user via token: {user_id}")
            return user_id
        elif credentials and credentials.credentials:
            # Token provided in demo mode
            user_id = f"demo-user-{credentials.credentials[:8]}"
            print("AUTH USER:", user_id)
            logger.info(f"Authenticated demo user via generic token: {user_id}")
            return user_id
        else:
            # Explicit demo session ID fallback when header omitted in local dev UI
            demo_id = "demo-analyst-session"
            print("AUTH USER:", demo_id)
            logger.info(f"Demo mode active: using session user {demo_id}")
            return demo_id

    # 2. Check Supabase JWT Production Authentication
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer header"
        )

    token = credentials.credentials
    supabase_url = config.SUPABASE_URL
    if not supabase_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase URL not configured (SUPABASE_URL)"
        )

    try:
        jwks = get_jwks(supabase_url)
        decoded = jwt.decode(
            token,
            jwks,
            algorithms=["ES256", "HS256", "RS256"],
            audience="authenticated",
            issuer=f"{supabase_url.rstrip('/')}/auth/v1",
            options={
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
                "verify_signature": True
            }
        )

        user_id = decoded.get("sub")
        if not user_id:
            logger.error("JWT token verification failed: missing sub claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub (user_id)"
            )

        print("AUTH USER:", user_id)
        logger.info(f"Successfully authenticated Supabase user: {user_id}")
        return user_id

    except jwt.ExpiredSignatureError:
        logger.warning("JWT token signature expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError as e:
        logger.warning(f"JWT verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication exception: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )
