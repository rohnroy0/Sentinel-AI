import os

class Config:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    NVD_API_KEY: str = os.getenv("NVD_API_KEY", "")
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", os.path.join("backend", "data", "investigations.db"))

config = Config()
