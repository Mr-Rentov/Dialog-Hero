# Dialog Hero – CLAUDE.md

## Project Overview
Dialog Hero is a web application for managing and working with dialogue scripts (Drehbücher).

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Python + FastAPI + Uvicorn

## Development
- Frontend: `cd frontend && npm run dev` (Port 5173)
- Backend: `cd backend && uvicorn main:app --reload` (Port 8000)

## Design System / Theme Colors
- **Primary:** `#2563EB` (Blue 600)
- **Primary Dark:** `#1D4ED8` (Blue 700)
- **Secondary:** `#64748B` (Slate 500)
- **Accent:** `#F59E0B` (Amber 500)
- **Background:** `#F8FAFC` (Slate 50)
- **Surface:** `#FFFFFF` (White)
- **Text Primary:** `#0F172A` (Slate 900)
- **Text Secondary:** `#475569` (Slate 600)
- **Border:** `#E2E8F0` (Slate 200)
- **Success:** `#10B981` (Emerald 500)
- **Error:** `#EF4444` (Red 500)

## Code Conventions
- TypeScript strict mode enabled
- Functional React components with hooks
- Tailwind CSS for styling (no CSS modules)
- FastAPI with Pydantic models for validation
- API routes prefixed with `/api/v1/`
