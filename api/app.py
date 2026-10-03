"""FastAPI application entrypoint.

Vercel looks for a `FastAPI` instance named `app` in `api/main.py`, so that
module re-exports this one.

No CORS middleware on purpose: the browser never talks to this service
directly. The Next.js server calls it server-to-server, and the admin panel
reaches it through server actions, so there is no cross-origin request to
allow.
"""

from fastapi import FastAPI

from .routes import admin, public, public_review

app = FastAPI(
    title="Mujahid Sajjad — site API",
    version="1.0.0",
    docs_url="/docs",
)

app.include_router(public)
app.include_router(public_review)
app.include_router(admin)