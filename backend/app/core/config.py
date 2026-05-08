from pydantic_settings import BaseSettings
from typing import List, Any
from pydantic import field_validator

class Settings(BaseSettings):
    APP_NAME: str = "StaySync"
    DEBUG: bool = False
    SECRET_KEY: str = "staysync-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/staysync"

    ALLOWED_ORIGINS: Any = ["http://localhost:5173", "http://localhost:3000", "https://staysync.vercel.app"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@staysync.com"

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    GROQ_API_KEY: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
