### **What do you need to provide for the Email Framework?**
To make the emailing system work, you need an **SMTP Account**. This is just a standard email account that allows sending via "Simple Mail Transfer Protocol".

You will need to provide these 4 values in your `.env` file (I will add the placeholders for you):
1.  **`SMTP_HOST`**: The server address (e.g., `smtp.gmail.com` for Google, `smtp.office365.com` for Outlook).
2.  **`SMTP_PORT`**: The port number (usually `587` for TLS or `465` for SSL).
3.  **`SMTP_USER`**: Your email address (e.g., `barangay.system@gmail.com`).
4.  **`SMTP_PASS`**: Your email password.
    *   *Note:* If you use Gmail with 2-Factor Authentication, you must generate an **"App Password"** and use that instead of your real password.

---

### **Implementation Plan**
Once you confirm, I will proceed with:

1.  **Switch MFA to Residents Only**: Update `authController.js` to enforce MFA for Residents (ID 12) and disable it for Staff.
2.  **Create Email Service**: Build a centralized `server/utils/emailService.js` to handle sending emails.
3.  **Add Notifications**: Update `certificateRequestController.js` and `documentRoutes.js` to send emails when requests are Approved/Rejected.
4.  **Update Docs**: Add the `SMTP_*` variables to `.env.example` so you can easily fill them in.
