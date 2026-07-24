"""Vercel serverless entry point for the FastAPI backend."""

import sys
from pathlib import Path

# Add Backend directory to the import path.
sys.path.insert(0, str(Path(__file__).parent.parent / "Backend"))

# Point SQLite to /tmp — the only writable path in Vercel's sandbox.
import database
database.DB_NAME = "/tmp/finance.db"

from fastapi import FastAPI
from main import app as _backend_app

# Mount the backend at /api so Vercel routing (/api/*) aligns with
# FastAPI's route definitions (/users, /login, etc.).
app = FastAPI()
app.mount("/api", _backend_app)
