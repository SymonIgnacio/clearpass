# Deployment Guide: Running ClearPass on a New Desktop

This guide provides step-by-step instructions for setting up and running the ClearPass system on a fresh desktop environment.

## 1. Prerequisites

Before installing the application, ensure the following software is installed on the target machine:

### Required Software
1.  **Node.js (v18 or higher)**
    *   **Download:** [https://nodejs.org/](https://nodejs.org/)
    *   **Verify:** Open a terminal and run `node -v` (Should be v18+).
2.  **MySQL Server (v8.0)**
    *   **Download:** [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)
    *   **Verify:** Open a terminal and run `mysql --version`.
    *   **Important:** Remember the `root` password you set during installation.
3.  **Python (v3.11 or higher)**
    *   **Download:** [https://www.python.org/downloads/](https://www.python.org/downloads/)
    *   **Verify:** Open a terminal and run `python --version`.
    *   **Important:** Check "Add Python to PATH" during installation.
4.  **Git**
    *   **Download:** [https://git-scm.com/downloads](https://git-scm.com/downloads)
    *   **Verify:** Open a terminal and run `git --version`.

---

## 2. Database Configuration

1.  Open **MySQL Workbench** or your preferred database tool.
2.  Connect to your local MySQL instance using your root password.
3.  Open a new query tab and execute the following command to create the database:
    ```sql
    CREATE DATABASE barangay_management;
    ```
    *Note: You do not need to create tables manually. The system's migration scripts will handle that in the next steps.*

---

## 3. Installation & Setup

1.  **Get the Code**
    Copy the project folder to your new desktop or clone it via Git:
    ```bash
    git clone <your-repository-url>
    cd clearpass
    ```

2.  **Automated Setup**
    The project includes a setup script that installs dependencies for the Client and Server, generates environment configuration files, and runs database migrations.
    
    Open a terminal in the project root (`clearpass/`) and run:
    ```bash
    npm run setup
    ```
    
    **What this does:**
    *   Installs Node.js dependencies for root, client, and server.
    *   Generates `.env` files in `server/` and `client/` if they don't exist.
    *   Runs database migrations to set up the `barangay_management` database tables.

3.  **Verify Environment Variables**
    *   Go to `server/.env`.
    *   Ensure `DB_PASSWORD` matches your local MySQL root password.
    *   Example:
        ```env
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=your_actual_password  <-- Update this if needed
        DB_NAME=barangay_management
        ```

---

## 4. Python AI Service Setup

The automated setup handles Node.js dependencies, but you must set up the Python environment manually for the AI features.

1.  **Navigate to the AI Service Directory**
    ```bash
    cd ai_service
    ```

2.  **Create a Virtual Environment (Recommended)**
    *   **Windows:**
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
    *   **Mac/Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install Python Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Return to Root**
    ```bash
    cd ..
    ```

---

## 5. Running the System

Once setup is complete, you can start all services (Client, Server, and AI Service) with a single command from the root directory:

```bash
npm run dev:all
```

### Accessing the Application
*   **Web Client:** Open your browser to [http://localhost:5174](http://localhost:5174)
*   **API Server:** Running on [http://localhost:3002](http://localhost:3002)
*   **AI Service:** Running in the background (Port 5001 usually)

---

## 6. Verification & Troubleshooting

### Health Check
Run the following command to verify all components are communicating correctly:
```bash
npm run health-check
```

### Common Issues

*   **Database Connection Refused:**
    *   **Cause:** Incorrect password in `server/.env` or MySQL is not running.
    *   **Fix:** Check `server/.env` `DB_PASSWORD` and ensure the MySQL service is started.

*   **"Python not found" or AI Service Fails:**
    *   **Cause:** Python is not in your system PATH or dependencies aren't installed.
    *   **Fix:** Re-install Python with "Add to PATH" checked, or ensure you activated the virtual environment before installing `requirements.txt`.

*   **Port Conflicts:**
    *   **Cause:** Another application is using port 3002 or 5174.
    *   **Fix:** Edit `.env` files to change ports or close the conflicting application.
