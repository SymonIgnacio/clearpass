# ClearPass Deployment Guide

This guide provides step-by-step instructions for deploying the ClearPass system, which consists of four distinct components:
1.  **Frontend**: React (Vite)
2.  **Backend**: Node.js (Express)
3.  **AI Service**: Python (Flask)
4.  **Database**: MySQL

---

## 🚀 Recommended Approach: Railway.app (Easiest & Integrated)

We recommend **Railway** because it supports all your components (Node, Python, MySQL) in a single project with automatic networking.

### Prerequisites
1.  Push your code to a **GitHub Repository**.
2.  Create an account at [Railway.app](https://railway.app/).

### Step 1: Create the Project
1.  Click **"New Project"** -> **"Provision MySQL"**.
2.  This will create a database. Click on it -> **Variables** to see your `DATABASE_URL`.

### Step 2: Deploy the Backend (Node.js)
1.  Click **"New"** -> **"GitHub Repo"** -> Select your repo.
2.  **Configure Service**:
    *   **Root Directory**: `/server`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
3.  **Variables**: Add the following env vars:
    *   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_NAME` (Copy from MySQL service)
    *   `JWT_SECRET`: (Generate a long random string)
    *   `AI_SERVICE_URL`: `http://ai-service-name.railway.internal:5001` (Replace `ai-service-name` with the actual service name you create in Step 3)
    *   `AI_SERVICE_ENABLED`: `true`

### Step 3: Deploy the AI Service (Python)
1.  Click **"New"** -> **"GitHub Repo"** -> Select the *same* repo again.
2.  **Configure Service**:
    *   **Root Directory**: `/ai_service`
    *   **Build Command**: (Leave empty, Railway detects `requirements.txt`)
    *   **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT chatbot_engine:app`
3.  **Variables**:
    *   `PORT`: `5001`

### Step 4: Deploy the Frontend (React)
*Option A: Deploy on Railway (Good for simplicity)*
1.  Add repo again.
2.  **Root Directory**: `/client`
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm run preview -- --host --port $PORT`
5.  **Variables**:
    *   `VITE_API_BASE_URL`: `https://your-backend-url.up.railway.app/api`
    *   `VITE_WS_URL`: `wss://your-backend-url.up.railway.app`

*Option B: Deploy on Vercel/Netlify (Better Performance)*
1.  Go to Vercel/Netlify -> Import Repo.
2.  **Root Directory**: `client`
3.  **Build Command**: `npm run build`
4.  **Output Directory**: `dist`
5.  **Environment Variables**:
    *   `VITE_API_BASE_URL`: (Your Railway Backend URL)

---

## 🛠️ Alternative Approach: VPS (DigitalOcean / Linode)

If you prefer full control or have a fixed budget, use a Virtual Private Server (VPS).

### Prerequisites
*   Ubuntu 22.04 LTS Server
*   Docker & Docker Compose installed

### Step 1: Prepare `docker-compose.yml`
Create a `docker-compose.yml` in your project root:

```yaml
version: '3.8'
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: securepassword
      MYSQL_DATABASE: barangay_management
    volumes:
      - db_data:/var/lib/mysql

  backend:
    build: ./server
    ports:
      - "3002:3002"
    environment:
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=securepassword
      - DB_NAME=barangay_management
      - AI_SERVICE_URL=http://ai_service:5001
    depends_on:
      - db

  ai_service:
    build: ./ai_service
    ports:
      - "5001:5001"

  frontend:
    build: ./client
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=/api

volumes:
  db_data:
```

### Step 2: Deploy
1.  SSH into your server.
2.  Clone your repo.
3.  Run: `docker-compose up -d --build`
4.  Run migrations: `docker-compose exec backend npm run db:migrate`

---

## ⚠️ Important Production Checklist

1.  **Database Migrations**:
    Always run migrations immediately after deployment:
    ```bash
    npm run db:migrate
    ```

2.  **Security**:
    *   **NEVER** commit `.env` files.
    *   Use strong, unique passwords for `JWT_SECRET` and Database.
    *   Ensure `NODE_ENV=production` is set for the backend.

3.  **CORS**:
    Update `server/index.js` to allow your production frontend domain:
    ```javascript
    // In server/index.js
    const corsOrigins = ['https://your-production-frontend.com'];
    ```
