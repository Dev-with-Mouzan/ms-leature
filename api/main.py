"""Vercel entrypoint.

Vercel resolves a Python function by looking for a FastAPI instance named
`app`. Keeping this a two-line re-export means the application itself stays
importable as `api.app:app` for local uvicorn with identical behaviour.
"""

from .app import app

__all__ = ["app"]