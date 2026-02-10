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
- **Primary:** `#007AFF` (Apple Blue)
- **Primary Hover:** `#0063D1`
- **Background:** `#F5F5F7` (Apple Light Gray)
- **Foreground:** `#1D1D1F` (Apple Dark)
- **Secondary Text:** `#86868B` (Apple Gray)
- **Surface:** `#FFFFFF` (White)
- **Border:** `#D2D2D7` (Apple Border)
- **Success:** `#34C759` (Apple Green)
- **Error:** `#FF3B30` (Apple Red)

## Code Conventions
- TypeScript strict mode enabled
- Functional React components with hooks
- Tailwind CSS for styling (no CSS modules)
- FastAPI with Pydantic models for validation
- API routes prefixed with `/api/v1/`
