import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_NAME = 'ERP System';
const BRAND_COLOR = '#1a3cff';

const baseTemplate = (content: string, ctaText?: string, ctaUrl?: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    <div style="background-color: ${BRAND_COLOR}; padding: 20px; text-align: center; color: white;">
      <h1>${APP_NAME}</h1>
    </div>
    <div style="padding: 30px; line-height: 1.6; color: #0f172a;">
      ${content}
      ${ctaText && ctaUrl ? `
        <div style="text-align: center; margin-top: 30px;">
          <a href="${ctaUrl}" style="background-color: ${BRAND_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            ${ctaText}
          </a>
        </div>
      ` : ''}
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #475569;">
      <p>If you didn't request this email, please ignore it.</p>
      <p>&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
    </div>
  </div>
`;

export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  const url = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  const content = `
    <p>Hello ${name},</p>
    <p>Thank you for registering. Please verify your email address to get started.</p>
    <p>This link will expire in 24 hours.</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your email address',
    html: baseTemplate(content, 'Verify Email', url),
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const url = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  const content = `
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, your account is safe.</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset your password',
    html: baseTemplate(content, 'Reset Password', url),
  });
};

export const sendAccountApprovedEmail = async (email: string, name: string) => {
  const url = `${process.env.FRONTEND_URL}/auth/login`;
  const content = `
    <p>Hello ${name},</p>
    <p>Your account has been approved by an administrator. You can now log in to the dashboard.</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your account has been approved',
    html: baseTemplate(content, 'Go to Dashboard', url),
  });
};

export const sendAccountRejectedEmail = async (email: string, name: string, reason: string) => {
  const content = `
    <p>Hello ${name},</p>
    <p>Your account request update: Unfortunately, your request was rejected.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>Contact your administrator for more information.</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Account request update',
    html: baseTemplate(content),
  });
};

export const sendNewPendingApprovalEmail = async (adminEmail: string, userData: any) => {
  const url = `${process.env.FRONTEND_URL}/dashboard/approvals`;
  const content = `
    <p>A new account is pending your approval:</p>
    <ul>
      <li><strong>Name:</strong> ${userData.fullName}</li>
      <li><strong>Email:</strong> ${userData.email}</li>
      <li><strong>Role:</strong> ${userData.role}</li>
      ${userData.department ? `<li><strong>Department:</strong> ${userData.department}</li>` : ''}
    </ul>
    <p>Reason for access: ${userData.reason || 'N/A'}</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    subject: 'New account pending your approval',
    html: baseTemplate(content, 'Review in Dashboard', url),
  });
};
