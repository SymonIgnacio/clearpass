# Deployment Guide: Running ClearPass on a New Desktop

## 1. Prerequisites
Before starting, ensure the target desktop has the following installed:
- **Node.js (v18+)**: [Download Here](https://nodejs.org/)
- **MySQL Server (v8.0)**: [Download Here](https://dev.mysql.com/downloads/installer/)
- **Python (v3.11+)**: [Download Here](https://www.python.org/downloads/)
- **Git**: [Download Here](https://git-scm.com/downloads)

## 2. Database Configuration
1. Open MySQL Workbench or Command Line.
2. Create the database:
   ```sql
   CREATE DATABASE barangay_management;
   ```
   *Note: If you need a fresh start with seed data, the setup script will handle migrations.*

## 3. Installation & Setup
1. **Clone/Copy Repository**:
   ```bash
   git clone <repository-url>
   cd clearpass
   ```
2. **Install Dependencies & Initialize Environment**:
   Run the automated setup command which installs Node modules, generates `.env` files, and runs DB migrations:
   ```bash
   npm run setup
   ```
   *This command executes `npm install`, `npm run setup-env`, and `npm run db:migrate` automatically.*

## 4. Python AI Service Setup
The automated setup does not cover Python dependencies. You must install them manually:
1. Navigate to the AI service directory:
   ```bash
   cd ai_service
   ```
2. (Optional but Recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

## 5. Running the System
1. Return to the root directory:
   ```bash
   cd ..
   ```
2. Start all services (Client, Server, AI) with one command:
   ```bash
   npm run dev:all
   ```
   - **Client**: http://localhost:5174
   - **Server**: http://localhost:3002
   - **AI Service**: Runs in background

## 6. Verification
- Run `npm run health-check` to verify all systems are operational.
- Log in with default credentials (if seeded) or create a new admin account via the registration page (if enabled).

## 7. Troubleshooting
- **Database Connection Error**: Check `server/.env` and ensure `DB_PASSWORD` matches your local MySQL setup.
- **Python Errors**: Ensure Python 3.11+ is in your system PATH.
