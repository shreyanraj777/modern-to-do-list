// utils/emailService.js - Nodemailer SMTP service for sending OTP verification emails
import nodemailer from 'nodemailer';

// Checks if all required SMTP environment variables are properly configured.
export const isEmailConfigured = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return false;
  }

  return true;
};

// Creates a Nodemailer SMTP transporter using environment variable configurations.
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: pass,
    },
  });

  return transporter;
};

// Sends an OTP email to the specified recipient using Nodemailer SMTP.
export const sendOtpEmail = async (toEmail, otp, purpose) => {
  if (!isEmailConfigured()) {
    const configError = new Error(
      'Email service is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM in your .env file.'
    );
    configError.code = 'EMAIL_NOT_CONFIGURED';
    throw configError;
  }

  const transporter = createTransporter();
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;

  const isRegistration = purpose === 'registration';
  const actionTitle = isRegistration ? 'Email Verification' : 'Login Authentication';
  const subject = `Your Modern To-Do Verification Code: ${actionTitle}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0;">Modern To-Do List</h2>
      <p style="color: #475569; font-size: 15px;">You requested a one-time verification code for <strong>${actionTitle}</strong>.</p>
      <div style="background-color: #f1f5f9; border-radius: 6px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This code will expire in <strong>5 minutes</strong> and can only be used once.</p>
      <p style="color: #64748b; font-size: 13px;">If you did not make this request, please disregard this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Modern To-Do List Application • College Web Programming Project</p>
    </div>
  `;

  const textContent = `Your Modern To-Do ${actionTitle} code is: ${otp}. It will expire in 5 minutes.`;

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};
