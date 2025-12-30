const nodemailer = require('nodemailer');

/**
 * CLEARPASS NOTIFICATION SERVICE
 * Handles email notifications for critical system events
 * Uses nodemailer with SMTP configuration from environment variables
 */

// Create transporter with SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send generic email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @param {string} text - Plain text fallback
 */
async function sendEmail(to, subject, html, text) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Barangay Management System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    // Don't throw error to prevent breaking the main flow
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new residents
 * @param {Object} resident - Resident object with email, first_name, last_name
 */
async function sendWelcomeEmail(resident) {
  const subject = 'Welcome to Barangay Management System';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Barangay Management System</h1>
        </div>
        <div class="content">
          <h2>Hello ${resident.First_Name} ${resident.Last_Name}!</h2>
          <p>Your account has been successfully created and verified.</p>
          <p>You can now:</p>
          <ul>
            <li>Request barangay documents and certificates</li>
            <li>Access community services and programs</li>
            <li>Stay updated with barangay announcements</li>
          </ul>
          <p>Please keep your login credentials secure and do not share them with others.</p>
          <p>If you have any questions, please contact the barangay office.</p>
          <br>
          <p>Best regards,<br>Barangay Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Barangay Management System

    Hello ${resident.First_Name} ${resident.Last_Name}!

    Your account has been successfully created and verified.

    You can now request barangay documents and certificates, access community services, and stay updated with announcements.

    Please keep your login credentials secure.

    Best regards,
    Barangay Management Team
  `;

  // Note: Email not stored in resident record yet, so we use a placeholder
  // In production, you'd need to add email field to residents table
  const recipientEmail = resident.email || `resident${resident.Resident_ID}@barangay.local`;

  return await sendEmail(recipientEmail, subject, html, text);
}

/**
 * Send incident report notification to barangay officials
 * @param {Object} incident - Incident details from blotter case
 * @param {Object} resident - Resident who filed the report
 */
async function sendIncidentReportNotification(incident, resident) {
  const subject = `New Incident Report: ${incident.Case_Number}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .incident-details { background-color: white; padding: 15px; border-left: 4px solid #FF5722; margin: 10px 0; }
        .footer { background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
        .urgent { color: #FF5722; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Incident Report Filed</h1>
        </div>
        <div class="content">
          <p class="urgent">URGENT: New incident report requires immediate attention</p>

          <div class="incident-details">
            <h3>Case Details:</h3>
            <p><strong>Case Number:</strong> ${incident.Case_Number}</p>
            <p><strong>Incident Type:</strong> ${incident.Incident_Type}</p>
            <p><strong>Location:</strong> ${incident.Location_Sitio}</p>
            <p><strong>Date/Time:</strong> ${new Date(incident.DateTime_Incident).toLocaleString()}</p>
            <p><strong>Status:</strong> ${incident.Status}</p>
          </div>

          <div class="incident-details">
            <h3>Reporter Information:</h3>
            <p><strong>Name:</strong> ${resident.First_Name} ${resident.Last_Name}</p>
            <p><strong>Resident ID:</strong> ${resident.Resident_ID}</p>
            <p><strong>Contact:</strong> ${resident.Mobile_Number || 'Not provided'}</p>
          </div>

          <div class="incident-details">
            <h3>Incident Narrative:</h3>
            <p>${incident.Narrative}</p>
          </div>

          <p><strong>Action Required:</strong> Please review this case and take appropriate action. The resident is currently blocked from obtaining barangay clearances.</p>

          <br>
          <p>Best regards,<br>Barangay Management System</p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    NEW INCIDENT REPORT

    URGENT: New incident report requires immediate attention

    Case Details:
    - Case Number: ${incident.Case_Number}
    - Incident Type: ${incident.Incident_Type}
    - Location: ${incident.Location_Sitio}
    - Date/Time: ${new Date(incident.DateTime_Incident).toLocaleString()}
    - Status: ${incident.Status}

    Reporter Information:
    - Name: ${resident.First_Name} ${resident.Last_Name}
    - Resident ID: ${resident.Resident_ID}
    - Contact: ${resident.Mobile_Number || 'Not provided'}

    Incident Narrative:
    ${incident.Narrative}

    Action Required: Please review this case and take appropriate action.

    Best regards,
    Barangay Management System
  `;

  // Send to barangay officials - using admin email from env or default
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@barangay.local';

  return await sendEmail(adminEmail, subject, html, text);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendIncidentReportNotification,
};
