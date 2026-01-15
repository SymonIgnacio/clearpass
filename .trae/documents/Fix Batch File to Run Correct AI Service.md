I found the bug! The batch file `run-clearpass.bat` is trying to run the wrong Python file.

### The Issue
*   **Current Batch File**: Runs `python smart_suggestions.py`.
    *   This file is just a library of helper functions. It runs and **exits immediately** because it doesn't start a server.
*   **Correct File**: It should run `python suggestion_engine.py`.
    *   This is the actual Flask application that listens on port 5000.

Because the service exits immediately, the backend can't connect to it, resulting in the **503 Service Unavailable** error.

### The Fix
I will update `run-clearpass.bat` to launch the correct file.

1.  **Edit `run-clearpass.bat`**:
    *   Change `python smart_suggestions.py` to `python suggestion_engine.py`.

After this fix, when you run the batch file, the AI service window will stay open and display "Running on http://0.0.0.0:5000", and the error will disappear.
