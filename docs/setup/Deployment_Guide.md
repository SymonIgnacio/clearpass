# Deployment Guide: Netlify and Railway

This guide provides step-by-step instructions for deploying the BMWs Barangay Management System.

- **Frontend (`client/`)** will be deployed on **Netlify**.
- **Backend Services (`server/`, `ai_service/`, `database`)** will be deployed on **Railway**.

---

## Prerequisites

1.  **Accounts:**
    *   A [GitHub](https://github.com/) account.
    *   A [Netlify](https://www.netlify.com/) account.
    *   A [Railway](https://railway.app/) account.
2.  **Codebase:** Ensure your entire project is pushed to a GitHub repository.

---

## Part 1: Deploying Backend Services on Railway

Railway will host our Node.js API, the Python AI service, and the MySQL database.

### Step 1: Create a Railway Project

1.  Log in to your Railway dashboard.
2.  Click **New Project**.
3.  Select **Deploy from GitHub repo** and choose your project's repository.

### Step 2: Add the MySQL Database

1.  Inside your new Railway project, click **New**.
2.  Select **Database** > **Add MySQL**.
3.  Railway will provision the database. Once it's ready, click on the new MySQL service and go to the **Variables** tab. You will see connection strings like `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, and `MYSQLPORT`. We will use these for our API server.

### Step 3: Deploy the Node.js API Server

1.  Go back to the project canvas and click **New**.
2.  Select **GitHub Repo** and choose your repository again.
3.  A menu will appear. **Important:** Select the option to deploy from a subdirectory and enter `server` as the **Root Directory**.
4.  Railway will automatically detect the `Dockerfile` in the `server` directory and begin the deployment.
5.  Once the service is created, go to its **Settings** tab and under "Domains", click **Generate Domain** to create a public URL. This will be your backend API's public address (e.g., `my-backend-url.up.railway.app`).
6.  Go to the **Variables** tab and add the following:
    *   `DB_HOST`: `${MYSQLHOST}`
    *   `DB_USER`: `${MYSQLUSER}`
    *   `DB_PASSWORD`: `${MYSQLPASSWORD}`
    *   `DB_DATABASE`: `${MYSQLDATABASE}`
    *   `DB_PORT`: `${MYSQLPORT}`
    *   `JWT_SECRET`: **Generate a strong, random string for this value.**
    *   `AI_SERVICE_URL`: We will set this in the next step.

### Step 4: Deploy the Python AI Service

1.  Click **New** again and select your **GitHub Repo**.
2.  Set the **Root Directory** to `ai_service`.
3.  Railway will build and deploy the Python service using its `Dockerfile`.
4.  This service does not need a public domain. Railway will automatically assign it a private network address (e.g., `ai-service.railway.internal`).
5.  Now, go back to your **Node.js API service's variables** (`server`) and set the `AI_SERVICE_URL` variable:
    *   `AI_SERVICE_URL`: `http://ai_service:5000` (Railway automatically maps the service name `ai_service` to its internal IP address. Port `5000` is exposed in the `ai_service/Dockerfile`).

### Step 5: Run Database Migrations

1.  With the `server` service deployed and connected to the database, we need to run the database migrations and seeds.
2.  Open the `server` service in Railway. Go to the **Deployments** tab and click on the latest successful deployment.
3.  Click the **...** menu and select **Open shell**.
4.  In the terminal that appears, run the following commands one by one:
    ```bash
    # To run the database schema migrations
    npm run migrate:latest
    
    # To seed the database with initial data
    npm run seed:run
    ```
5.  Close the shell. Your backend is now fully deployed and ready.

---

## Part 2: Deploying the Frontend on Netlify

### Step 1: Create a Netlify Site

1.  Log in to your Netlify dashboard.
2.  Click **Add new site** > **Import an existing project**.
3.  Connect to GitHub and select your project's repository.

### Step 2: Configure Build Settings

1.  Netlify will show you the build settings. Your `netlify.toml` file already defines these, but verify they are correct:
    *   **Build command:** `npm run build --prefix client`
    *   **Publish directory:** `client/dist`
2.  Click on **Show advanced**, then **New variable**.

### Step 3: Set the API URL

1.  You need to tell your frontend where to find the backend API.
2.  Create one environment variable:
    *   **Key:** `VITE_API_BASE_URL`
    *   **Value:** Enter the public URL of your Railway `server` service, followed by `/api`. For example: `https://my-backend-url.up.railway.app/api`

### Step 4: Deploy

1.  Click **Deploy site**.
2.  Netlify will build your React application and deploy it. Once finished, you can visit your Netlify URL to see your live website.

Your application is now live!
