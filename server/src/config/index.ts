import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  database: { url: process.env.DATABASE_URL || '' },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  jwt: { secret: process.env.JWT_SECRET || 'fallback-secret', refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', expiresIn: process.env.JWT_EXPIRES_IN || '15m', refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' },
  oauth: { google: { clientId: process.env.GOOGLE_CLIENT_ID || '', clientSecret: process.env.GOOGLE_CLIENT_SECRET || '', callbackUrl: process.env.GOOGLE_CALLBACK_URL || '' }, discord: { clientId: process.env.DISCORD_CLIENT_ID || '', clientSecret: process.env.DISCORD_CLIENT_SECRET || '', callbackUrl: process.env.DISCORD_CALLBACK_URL || '' }, steam: { apiKey: process.env.STEAM_API_KEY || '', callbackUrl: process.env.STEAM_CALLBACK_URL || '' } },
  cloudinary: { cloudName: process.env.CLOUDINARY_CLOUD_NAME || '', apiKey: process.env.CLOUDINARY_API_KEY || '', apiSecret: process.env.CLOUDINARY_API_SECRET || '' },
  stripe: { secretKey: process.env.STRIPE_SECRET_KEY || '', webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '' },
  openai: { apiKey: process.env.OPENAI_API_KEY || '' },
  email: { host: process.env.SMTP_HOST || 'smtp.gmail.com', port: parseInt(process.env.SMTP_PORT || '587', 10), user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '', from: process.env.EMAIL_FROM || 'noreply@gamerhub.com' },
  firebase: { projectId: process.env.FIREBASE_PROJECT_ID || '', privateKey: process.env.FIREBASE_PRIVATE_KEY || '', clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '' },
  encryption: { key: process.env.ENCRYPTION_KEY || 'default-encryption-key-32bytes!!' },
};
