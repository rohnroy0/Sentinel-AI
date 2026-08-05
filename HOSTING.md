# Sentinel-AI Production Hosting & Cloud Deployment Guide

This guide provides step-by-step instructions for deploying **Sentinel-AI** to a production cloud environment.

---

## 1. Production Architecture Overview

Sentinel-AI is architected for decoupled cloud hosting:

```
┌─────────────────────────┐      HTTPS / REST      ┌───────────────────────────┐
│     Vercel Frontend     │ ─────────────────────► │   Render / Fly.io Backend │
│   (React 19 + Vite 8)   │ ◄───────────────────── │      (FastAPI + Uvicorn)   │
└────────────┬────────────┘                        └─────────────┬─────────────┘
             │                                                   │
             │              Supabase Client SDK & Auth           │
             └───────────────────────────┬───────────────────────┘
                                         ▼
                           ┌───────────────────────────┐
                           │    Supabase Cloud Engine  │
                           │  (PostgreSQL + JWT Auth)  │
                           └───────────────────────────┘
```

- **Frontend:** Hosted on **Vercel** (Global Edge CDN, automatic SPA rewrites via `vercel.json`).
- **Backend:** Hosted on **Render** / **Fly.io** / **Container (Docker)** running FastAPI with Gunicorn/Uvicorn workers.
- **Database & Auth:** Hosted on **Supabase** (PostgreSQL database with multi-tenant `user_id` row-level security and Supabase Auth).

---

## 2. Production Environment Variables

### Root Configuration Template (`.env.example`)

#### Frontend Environment Variables (Vercel)
Set these in your Vercel Project Settings → Environment Variables:

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Public production backend API URL | `https://sentinel-backend.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase project endpoint URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public API key | `eyJhbGciOiJIUzI1...` |

#### Backend Environment Variables (Render / Fly.io / Docker)
Set these in your Render/Fly Dashboard → Environment Variables:

| Variable | Description | Recommended Production Value |
|---|---|---|
| `DATABASE_ENGINE` | Database adapter engine | `supabase` |
| `AUTH_MODE` | Authentication mode | `supabase` |
| `SUPABASE_URL` | Supabase project URL | `https://xyzcompany.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role secret key | `eyJhbGciOiJIUzI1...` |
| `JWT_SECRET` | Supabase JWT Secret for token verification | `your-supabase-jwt-secret` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | (Optional) OpenAI API key for LLM summaries | `sk-proj-...` |
| `NVD_API_KEY` | (Optional) NIST NVD API key for live CVE lookup | `your-nvd-api-key` |
| `DATABASE_PATH` | (Optional local fallback) SQLite DB path | `./data/investigations.db` |

---

## 3. Step-by-Step Deployment Guide

### Step 1: Database & Auth Setup (Supabase)

1. Log into [Supabase Console](https://supabase.com) and create a new project.
2. Go to **SQL Editor** and run the initial table creation script:
   ```sql
   CREATE TABLE IF NOT EXISTS investigations (
       id TEXT PRIMARY KEY,
       user_id TEXT NOT NULL,
       scan_name TEXT,
       user_goal TEXT,
       status TEXT,
       risk_score REAL DEFAULT 0,
       scan_data TEXT,
       full_state JSONB,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );

   CREATE INDEX IF NOT EXISTS idx_investigations_user_id ON investigations(user_id);
   ```
3. Go to **Project Settings → API** and retrieve:
   - `Project URL` (`SUPABASE_URL` / `VITE_SUPABASE_URL`)
   - `anon public key` (`VITE_SUPABASE_ANON_KEY`)
   - `service_role secret key` (`SUPABASE_SERVICE_ROLE_KEY`)
   - `JWT Secret` (`JWT_SECRET` under JWT Settings)

---

### Step 2: Backend Deployment (Render / Fly.io)

#### Option A: Render Deployment (Web Service)
Render can deploy either from the repository root (Default) or from the `backend/` subfolder:

##### Method 1: Default Root Deployment (Recommended)
1. Log into [Render Dashboard](https://dashboard.render.com) and click **New + → Web Service**.
2. Connect your GitHub repository (`Sentinel-AI`).
3. Leave **Root Directory** blank (defaults to repository root `.`).
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `gunicorn --pythonpath backend main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
6. Add the environment variables listed in Section 2 under **Environment Variables**.
7. Click **Create Web Service**.

##### Method 2: Subdirectory Deployment (`backend/`)
If you set **Root Directory** in Render Settings to `backend`:
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`


#### Option B: Docker Container Deployment (Fly.io / Render Docker)
You can build and run using the provided `backend/Dockerfile`:
```bash
docker build -t sentinel-backend backend/
docker run -d -p 8000:8000 --env-file backend/.env sentinel-backend
```

---

### Step 3: Frontend Deployment (Vercel)

1. Log into [Vercel Dashboard](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repository.
3. Set **Framework Preset:** `Vite`
4. Set **Root Directory:** `frontend`
5. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://sentinel-backend.onrender.com`
   - `VITE_SUPABASE_URL` = `https://xyzcompany.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOi...`
6. Click **Deploy**.
7. Once deployed, note your frontend URL (e.g. `https://sentinel-ai.vercel.app`).
8. Return to your **Render Backend Settings** and ensure `CORS_ORIGINS` includes your Vercel URL:
   `CORS_ORIGINS=https://sentinel-ai.vercel.app`

---

## 4. Health & Production Security Verification

### 1. Health Monitoring Endpoint
Verify backend database connectivity and environment state by visiting:
```http
GET https://sentinel-backend.onrender.com/health
```
Expected JSON Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "db_engine": "supabase",
  "db_status": {
    "status": "ok",
    "engine": "supabase"
  },
  "auth_mode": "supabase",
  "environment_mode": "production"
}
```

### 2. Verification Test Suite Execution
Run the automated backend test suite:
```bash
python backend/tests/test_agent_system.py
```

### 3. Frontend Production Build Verification
Test local compilation of the static distribution bundle:
```bash
cd frontend
npm run build
```

---

## 5. Security Architecture & Rationale

1. **Client Confidentiality:** Secrets such as `SUPABASE_SERVICE_ROLE_KEY` and `JWT_SECRET` remain strictly on the backend. Only public `VITE_SUPABASE_ANON_KEY` is present on the client.
2. **Strict Multi-Tenant Isolation:** Every repository read/write verifies `user_id` extracted from the cryptographically verified JWT token. Requests without valid identity tokens are safely rejected.
3. **CORS Hardening:** Cross-Origin Resource Sharing is restricted strictly to the authorized production frontend domains specified in `CORS_ORIGINS`.
4. **SPA Single-Page Routing:** `frontend/vercel.json` ensures that direct navigation and browser refreshes on routes such as `/login`, `/app/dashboard`, and `/app/agent-console` rewrite to `/index.html` without returning 404 HTTP errors.

---

## 6. Troubleshooting

- **CORS Error (`Access-Control-Allow-Origin`):** Ensure `CORS_ORIGINS` in your backend deployment settings includes your exact frontend URL without a trailing slash (e.g., `https://my-app.vercel.app`).
- **404 on Page Refresh:** Verify that `frontend/vercel.json` is located inside the frontend folder and committed to Git.
- **Supabase Connection Errors:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` match your Supabase project settings. Ensure the `investigations` table has been created in Supabase SQL Editor.
