const nodemailer = require('nodemailer');

const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

/**
 * Sends the password reset email if SMTP is configured. Otherwise just logs the
 * link so the flow still works end-to-end in local development.
 */
async function sendPasswordReset(toEmail, resetUrl) {
  if (!isConfigured) {
    console.log(`[mailer] SMTP not configured — password reset link for ${toEmail}: ${resetUrl}`);
    return { sent: false, resetUrl };
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'SkyPadel <no-reply@skypadel.example>',
    to: toEmail,
    subject: 'Reset your SkyPadel password',
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: `<p>Reset your SkyPadel password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`
  });
  return { sent: true, resetUrl };
}

module.exports = { isConfigured, sendPasswordReset };
