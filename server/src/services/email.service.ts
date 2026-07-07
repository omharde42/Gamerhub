import nodemailer from 'nodemailer';
import { config } from '../config';
let transporter: nodemailer.Transporter | null = null;
const getTransporter = () => {
  if (!transporter) { transporter = nodemailer.createTransport({ host: config.email.host, port: config.email.port, secure: config.email.port === 465, auth: { user: config.email.user, pass: config.email.pass } }); }
  return transporter;
};
interface EmailOptions { to: string; subject: string; html: string; text?: string; }
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const t = getTransporter();
    await t.sendMail({ from: `"GamerHub" <${config.email.from}>`, to: options.to, subject: options.subject, html: options.html, text: options.text });
  } catch (error) { console.error('Email sending failed:', error); }
};
export const sendWelcomeEmail = async (email: string, username: string): Promise<void> => {
  await sendEmail({ to: email, subject: 'Welcome to GamerHub!', html: `<h1>Welcome to GamerHub!</h1><p>Hi ${username},</p><p>Welcome to the ultimate gaming network. Complete your profile to get started!</p>` });
};
