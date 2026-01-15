# Multi-Cloud Deployment Guide (Netlify + Vercel + Railway)

This guide details how to deploy your stack across three specialized platforms for maximum performance and free-tier optimization.

## Architecture

| Component                   | Platform    | Why?                                                                      |
| :-------------------------- | :---------- | :------------------------------------------------------------------------ |
| **Frontend (React)**        | **Netlify** | Best-in-class CDN, instant rollbacks, and simple SPA routing.             |
| **Backend (Node + Python)** | **Vercel**  | Serverless functions support both Node.js and Python in the same project. |
| **Database (MySQL)**        | **Railway** | Persistent storage that isn't serverless (Vercel/Netlify don't host DBs). |

---

## Step 1: Database (Railway)

1.  Log in to [Railway](https://railway.app/).
2.  Create a **New Project** → **Provision MySQL**.
3.  Click the **MySQL** card → **Variables**.
4.  Copy the connection details (`MYSQLHOST`, `MYSQLUSER`, etc.). You will need these for Vercel.

---

## Step 2: Backend (Vercel)

1.  Push your code to GitHub.
2.  Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
3.  Import your repository.
4.  **Framework Preset:** Select **Other**.
5.  **Root Directory:** Leave as `./` (Root).
6.  **Environment Variables:** Add the following:

    - `NODE_ENV`: `production`
    - `DB_HOST`: (From Railway)
    - `DB_USER`: (From Railway)
    - `DB_PASSWORD`: (From Railway)
    - `DB_NAME`: (From Railway)
    - `DB_PORT`: (From Railway)
    - `JWT_SECRET`: (Generate a secure random string)
    - `AI_SERVICE_URL`: `https://your-vercel-project-name.vercel.app/api/ai-service` (Points to itself internally via rewrites)
    - `AI_SERVICE_ENABLED`: `true`
    - `FRONTEND_URL`: `https://your-netlify-site-name.netlify.app` (You'll get this in Step 3, come back to update it later).

7.  Click **Deploy**.
    - _Note: Vercel will automatically detect `vercel.json` and configure the Node.js and Python serverless functions. The root `build` script is intentionally disabled to prevent Vercel from building the client._

---

## Step 3: Frontend (Netlify)

1.  Log in to [Netlify](https://www.netlify.com/).
2.  Click **Add new site** → **Import from an existing project**.
3.  Connect GitHub and select your repository.
4.  **Build Settings:**
    - **Base directory:** `client` (Important!)
    - **Build command:** `npm run build`
    - **Publish directory:** `dist`
5.  **Environment Variables:**
    - `VITE_API_URL`: Your Vercel URL from Step 2 (e.g., `https://project-name.vercel.app/api`)
6.  Click **Deploy**.

---

## Step 4: Final Configuration

1.  **Update CORS:**

    - Go back to your **Vercel Project Settings** → **Environment Variables**.
    - Update `FRONTEND_URL` with your actual Netlify URL (e.g., `https://awesome-site-123.netlify.app`).
    - Redeploy Vercel for changes to take effect (Deployment → Redeploy).

2.  **Verify Connection:**
    - Open your Netlify URL.
    - Try to log in. The request should go to Vercel, which talks to Railway, and return a token.

---

## Troubleshooting

- **CORS Errors:** Ensure `FRONTEND_URL` in Vercel matches your Netlify URL exactly (no trailing slash).
- **404 on Refresh:** Ensure `netlify.toml` is present in the root. It handles the SPA redirects (`/*` -> `/index.html`).
- **Database Error:** Verify Railway credentials in Vercel. Ensure Railway MySQL service is active.
