The error `ECONNRESET` during upload is caused by the MySQL server's `max_allowed_packet` setting being too small (currently **1MB**), while your file is **~4.2MB**.

I will fix this by increasing the limit in your MySQL configuration.

### 1. Update MySQL Configuration
I will edit `c:\xampp\mysql\bin\my.ini` to increase the packet size limit.
- **Change:** `max_allowed_packet=1M` → `max_allowed_packet=64M`
- **Reason:** Allows uploading files larger than 1MB (up to 64MB).

### 2. Manual Restart Required
**IMPORTANT:** After I apply this change, you must manually restart MySQL for it to take effect:
1.  Open **XAMPP Control Panel**.
2.  Click **Stop** next to MySQL.
3.  Wait for it to stop, then click **Start**.

This will resolve the `ECONNRESET` error and allow the template upload to succeed.