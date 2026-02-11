from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine
from routers import auth, health, scripts

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(scripts.router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {"app": "Dialog Hero", "docs": "/docs", "health": "/api/v1/health"}
