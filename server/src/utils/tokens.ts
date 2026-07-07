import crypto from 'crypto';
import { config } from '../config';
const ALGORITHM = 'aes-256-gcm'; const IV_LENGTH = 16;
export const encrypt = (text: string): string => {
  const key = Buffer.from(config.encryption.key.padEnd(32).slice(0, 32));
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex'); encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};
export const decrypt = (encryptedText: string): string => {
  const key = Buffer.from(config.encryption.key.padEnd(32).slice(0, 32));
  const parts = encryptedText.split(':'); const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex'); const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv); decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8'); decrypted += decipher.final('utf8');
  return decrypted;
};
