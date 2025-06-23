import crypto from 'crypto';

const MASTER_KEY = process.env.SECRET_MANAGER_KEY;
if (!MASTER_KEY || MASTER_KEY.length < 32) {
  throw new Error(
    'SECRET_MANAGER_KEY env variable must be set and at least 32 characters long',
  );
}

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // AES-GCM recommended IV size
const KEY = Buffer.from(MASTER_KEY, 'utf-8').slice(0, 32);

export class SecretManager {
  static encrypt(plainText: string): Buffer {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // Store as: [iv][authTag][encrypted]
    return Buffer.concat([iv, authTag, encrypted]);
  }

  static decrypt(value_encrypted: Buffer): string {
    const iv = value_encrypted.slice(0, IV_LENGTH);
    const authTag = value_encrypted.slice(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = value_encrypted.slice(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
