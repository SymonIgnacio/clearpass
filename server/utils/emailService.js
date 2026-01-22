const nodemailer = require('nodemailer');
require('dotenv').config();

const isSmtpConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isSmtpConfigured()) {
    console.warn('SMTP not configured, skipping email sending.');
    return;
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"ClearPass System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw, just log, so we don't break the request flow
  }
};

const sendRequestStatusEmail = async ({ to, residentName, requestType, status, remarks }) => {
  const subject = `Update on your ${requestType} Request`;
  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Hello ${residentName},</h2>
      <p>Your request for <strong>${requestType}</strong> has been <strong>${capitalizedStatus}</strong>.</p>
      ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
      <p>Please log in to your account for more details.</p>
      <br>
      <p>Best regards,</p>
      <p>ClearPass Team</p>
    </div>
  `;

  const text = `Hello ${residentName},\n\nYour request for ${requestType} has been ${capitalizedStatus}.\n${remarks ? `Remarks: ${remarks}\n` : ''}\nPlease log in to your account for more details.\n\nBest regards,\nClearPass Team`;

  await sendEmail({ to, subject, html, text });
};

module.exports = {
  isSmtpConfigured,
  sendEmail,
  sendRequestStatusEmail,
};
