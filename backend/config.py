import os

class Config:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    NVD_API_KEY: str = os.getenv("NVD_API_KEY", "")
    
    # Database Abstraction Configuration (Defaults to Production Supabase Engine)
    DATABASE_ENGINE: str = os.getenv("DATABASE_ENGINE", os.getenv("DB_ENGINE", "supabase")).lower()
    DB_ENGINE: str = DATABASE_ENGINE
    
    DATABASE_PATH: str = os.getenv(
        "DATABASE_PATH", 
        os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "investigations.db"))
    )
    
    # Supabase Production Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", os.getenv("SUPABASE_JWT_SECRET", ""))
    
    # Production CORS Allowed Origins (Comma-separated allowed domains)
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")
    
    # Production Authentication Mode: Default "supabase" (Fallback "demo")
    AUTH_MODE: str = os.getenv("AUTH_MODE", "supabase").lower()

config = Config()

