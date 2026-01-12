I have identified the issue. While your batch file tries to start the AI service, there is a **configuration mismatch** and likely **missing dependencies** preventing it from running correctly.

1.  **Port Mismatch:** Your `run-clearpass.bat` says the AI service is on **Port 5000**, but your backend server (`server/.env`) and the AI code (`suggestion_engine.py`) are configured for **Port 5001**.
2.  **Missing Dependencies:** The Python service likely crashes immediately because required libraries (like `flask`, `pandas`, `scikit-learn`) might not be installed in your environment.
3.  **Silent Failure:** Because the batch file launches separate windows, if the AI window crashes instantly, you might not notice it, leading to the "503 Service Unavailable" error in the main app.

### **The Plan**

I will perform the following steps to fix the system:

1.  **Install Python Dependencies:**
    - Run `pip install -r requirements.txt` in the `ai_service` directory to ensure all required libraries are installed.

2.  **Configure AI Service:**
    - Create a `ai_service/.env` file with `PORT=5001` and `FLASK_DEBUG=1` to explicitly lock the configuration.

3.  **Update Batch File (`run-clearpass.bat`):**
    - Correct the log messages to show **Port 5001** (instead of 5000).
    - This ensures the documentation matches the actual running service.

4.  **Launch & Verify:**
    - I will manually start the AI service in the idle terminal to confirm it runs without errors.
    - Once running, you can refresh your browser, and the 503 error should disappear.
