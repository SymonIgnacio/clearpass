# Railway Deployment Guide

This guide details how to deploy the full **ClearPass** stack (React Frontend + Node.js Backend + MySQL Database + Python AI Service) on [Railway](https://railway.app/).

## Architecture Overview

We recommend a **Monolithic Deployment** for the main application to simplify CORS and authentication, with a separate service for the AI Engine.

1.  **Service A (MySQL):** Managed Database.
2.  **Service B (AI Engine):** Python Service (Flask) running from `ai_service/`.
3.  **Service C (Main App):** Node.js + React. Node serves the React static files.

---

## Step 1: Prepare the Repository

1.  Ensure your project is pushed to a GitHub repository.
2.  **Important:** Verify `server/index.js` is set to serve `../client/dist` in production (this is already configured in the codebase).

---

## Step 2: Create the Project & Database

1.  Log in to [Railway](https://railway.app/) and click **New Project**.
2.  Select **Provision MySQL**.
    - This will create a new project with a MySQL database.
3.  Click on the **MySQL** card to view its variables. You will need these later.

---

## Step 3: Deploy the AI Service

The AI Service must be deployed first so we can get its URL for the Main App.

1.  In the same project, click **New** → **GitHub Repo**.
2.  Select your repository.
3.  **Before it deploys** (or immediately after), click the new service card to configure it:
    - **Settings** → **Root Directory**: Set to `/ai_service`.
    - **Settings** → **Watch Paths**: Set to `/ai_service/**`.
    - **Variables**: None required usually, unless you have specific AI keys.
    - **Networking**: Click **Generate Domain** (or note the internal service name, e.g., `ai-service.railway.internal`). You will need the **Private Networking URL** (recommended) or the Public Domain.
      - _Note: Using the Private URL (e.g., `http://ai-service.railway.internal:5000`) is faster and more secure._

---

## Step 4: Deploy the Main App (Node + React)

1.  Click **New** → **GitHub Repo** (Select the same repo again).
2.  Click the card to configure it:

    - **Settings** → **Root Directory**: Leave as `/` (Root).
    - **Settings** → **Config File**: Railway will automatically detect the `railway.toml` file in the root which handles the build and start commands.
    - **Variables**:
      - Open the `RAILWAY_VARIABLES.txt` file included in this project.
      - Copy the entire content.
      - In Railway, go to the **Variables** tab, click **Raw Editor**, and paste the content.
      - **Important:** Replace `JWT_SECRET` with a secure random string.
      - _Note: The `AI_SERVICE_URL` is already pre-filled with your provided domain._

3.  **Networking**: Click **Generate Domain** to make your app accessible to the public.

---

## Step 5: Database Migration

Once the Main App is deployed, the database will be empty. You need to create the schema.

**Option A: Automated Migration (Recommended)**

1.  Go to the **Main App** service in Railway.
2.  Click on the **Command Palette** (or Settings → Deployments).
3.  Run a custom command:
    ```bash
    npm run db:migrate
    ```
    _Note: This runs the Knex migrations defined in `server/migrations`._

**Option B: Manual Import**

1.  Connect to the MySQL instance using a tool like **DBeaver** or **MySQL Workbench** using the credentials from Step 2.
2.  Run the SQL dump located in `database/backups/` or `database/schema.sql` if available.

---

## Step 6: Verify & Maintain

### 24/7 Availability

Once deployed, your application runs on Railway's cloud servers. **It will remain online even if your local computer is turned off.**

### Session Management

- **Indefinite Sessions:** By default, user sessions are set to last indefinitely (1 year).
- **Force Logout:** If you need to log out all users (e.g., in case of a security breach), simply change the `JWT_SECRET` variable in Railway. This will immediately invalidate all active sessions.

---

## Alternative: Vercel / Netlify (Frontend Only)

If you prefer to host the Frontend on Vercel or Netlify for their CDN capabilities:

1.  **Deploy Backend on Railway:** Follow Step 4, but change the Build Command to just `npm install && cd server && npm install`.
2.  **Deploy Frontend on Vercel/Netlify:**
    - Import the `client` folder as the project root.
    - Build Command: `npm run build`
    - Output Directory: `dist`
    - **Environment Variables (in Vercel):**
      - `VITE_API_URL`: Your Railway Backend URL (e.g., `https://clearpass-api.up.railway.app`)
3.  **CORS Configuration:**
    - Update the `FRONTEND_URL` environment variable in your **Railway Backend** service to match your Vercel/Netlify domain (e.g., `https://clearpass.vercel.app`).

---

## Troubleshooting

- **"Table doesn't exist"**: Run the migrations (Step 5).
- **AI Features failing**: Check `AI_SERVICE_URL` in the Main App variables. Ensure the AI service is running and healthy.
- **Build fails**: Check the logs. Ensure `npm run install:all` is completing successfully within the timeout.
