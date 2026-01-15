# Railway Deployment Guide

## 1. Prerequisites
- A [Railway](https://railway.app/) account.
- A GitHub repository containing this project.

## 2. Setup Steps

1.  **Create a New Project on Railway**:
    *   Select "Deploy from GitHub repo".
    *   Choose your repository.

2.  **Configure Environment Variables**:
    *   Go to the "Variables" tab in your Railway project.
    *   Add the following variables:
        *   `NODE_ENV`: `production`
        *   `DB_HOST`: (See Step 3)
        *   `DB_USER`: `root` (or provided by Railway MySQL)
        *   `DB_PASSWORD`: (Provided by Railway MySQL)
        *   `DB_NAME`: `railway` (or `barangay_management`)
        *   `DB_PORT`: `3306`
        *   `JWT_SECRET`: (Generate a strong random string)
        *   `SERVER_PORT`: `3002` (Optional, Railway sets `PORT` automatically which the app uses)

3.  **Add a Database**:
    *   In your Railway project dashboard, click "New" -> "Database" -> "MySQL".
    *   Once created, Railway will provide the connection details (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, etc.).
    *   You can use Railway's "Reference" feature to link these directly to your app's variables (e.g., set `DB_HOST` to `${MYSQLHOST}`).

4.  **Build Command**:
    *   Go to "Settings" -> "Build".
    *   Set the **Build Command** to:
        ```bash
        npm run install:all && npm run build
        ```
        *(This installs dependencies for root, server, and client, then builds the client)*

5.  **Start Command**:
    *   Set the **Start Command** to:
        ```bash
        npm start
        ```

## 3. Database Migration
Since this is a new deployment, the database will be empty. You need to migrate your schema and data.

### Option A: Using the CLI (If you have local access)
1.  Connect to the Railway MySQL instance using a tool like MySQL Workbench or DBeaver (use the credentials from Railway).
2.  Run the SQL dump from your local backup (`database/backups/`).

### Option B: Using the App's Migration Script
The app includes migration scripts, but they run from the server context. You can try adding `npm run db:migrate` to your start command or running it as a one-off task, but restoring a full dump is recommended for the initial setup.

## 4. Verification
Once deployed, open the Railway-provided URL (e.g., `https://web-production-xxxx.up.railway.app`).
- The frontend should load.
- Try logging in (ensure you have seeded at least one admin user in the DB).
