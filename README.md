# Dialog Hero

Web application for managing and analyzing dialogue scripts.

## Project Structure

```
dialog-hero/
├── frontend/    # React + TypeScript + Vite + Tailwind CSS
├── backend/     # Python + FastAPI
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- Python 3.11+
- npm

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on [http://localhost:5173](http://localhost:5173).

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs on [http://localhost:8000](http://localhost:8000).

### Using Docker Compose (optional)

```bash
docker compose up
```

This starts both services simultaneously.

## API Endpoints

| Method | Path              | Description  |
| ------ | ----------------- | ------------ |
| GET    | `/api/v1/health`  | Health check |

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** FastAPI, Uvicorn, Pydantic
