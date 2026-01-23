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

const sendBlotterStatusEmail = async ({
  to,
  residentName,
  status,
  caseNumber,
  reason,
  notes,
  hearingDate,
}) => {
  const isApproved = status === 'approved';
  const subject = isApproved ? 'Blotter Request Approved - Summon Issued' : 'Blotter Request Rejected';

  let contentHtml = '';
  let contentText = '';

  if (isApproved) {
    const formattedDate = new Date(hearingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    contentHtml = `
      <p>Your blotter request has been <strong>APPROVED</strong> and a summon has been issued.</p>
      <p><strong>Case Number:</strong> ${caseNumber}</p>
      <p>Please proceed to the <strong>Barangay Hall</strong> on <strong>${formattedDate}</strong> (7 days from now) for the hearing/summoning.</p>
      <p>Failure to appear may result in further action.</p>
    `;
    contentText = `Your blotter request has been APPROVED and a summon has been issued.\nCase Number: ${caseNumber}\nPlease proceed to the Barangay Hall on ${formattedDate} (7 days from now) for the hearing/summoning.\nFailure to appear may result in further action.`;
  } else {
    contentHtml = `
      <p>Your blotter request has been <strong>REJECTED</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      ${notes ? `<p><strong>Officer Notes:</strong> ${notes}</p>` : ''}
    `;
    contentText = `Your blotter request has been REJECTED.\n${reason ? `Reason: ${reason}\n` : ''}${notes ? `Officer Notes: ${notes}\n` : ''}`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Hello ${residentName},</h2>
      ${contentHtml}
      <br>
      <p>Best regards,</p>
      <p>ClearPass Team</p>
    </div>
  `;

  const text = `Hello ${residentName},\n\n${contentText}\n\nBest regards,\nClearPass Team`;

  await sendEmail({ to, subject, html, text });
};

const sendCertificateStatusEmail = async ({
  to,
  residentName,
  documentType,
  status,
  remarks,
  pickupDate,
}) => {
  const isApproved = status === 'approved';
  const subject = `Update on your ${documentType} Request`;

  let contentHtml = '';
  let contentText = '';

  if (isApproved) {
    const formattedDate = new Date(pickupDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    contentHtml = `
      <p>Your request for <strong>${documentType}</strong> has been <strong>APPROVED</strong>.</p>
      <p>Please pick up your certificate at the Barangay Hall on <strong>${formattedDate}</strong> (tomorrow).</p>
      ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
      <p>Please bring a valid ID for verification.</p>
    `;
    contentText = `Your request for ${documentType} has been APPROVED.\nPlease pick up your certificate at the Barangay Hall on ${formattedDate} (tomorrow).\n${remarks ? `Remarks: ${remarks}\n` : ''}\nPlease bring a valid ID for verification.`;
  } else {
    contentHtml = `
      <p>Your request for <strong>${documentType}</strong> has been <strong>REJECTED</strong>.</p>
      ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
    `;
    contentText = `Your request for ${documentType} has been REJECTED.\n${remarks ? `Remarks: ${remarks}\n` : ''}`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Hello ${residentName},</h2>
      ${contentHtml}
      <br>
      <p>Best regards,</p>
      <p>ClearPass Team</p>
    </div>
  `;

  const text = `Hello ${residentName},\n\n${contentText}\n\nBest regards,\nClearPass Team`;

  await sendEmail({ to, subject, html, text });
};

module.exports = {
  isSmtpConfigured,
  sendEmail,
  sendRequestStatusEmail,
  sendBlotterStatusEmail,
  sendCertificateStatusEmail,
};
