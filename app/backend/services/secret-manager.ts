import crypto from 'crypto';

const MASTER_KEY = process.env.SECRET_MANAGER_KEY;

/**
 * SECRET_MANAGER_KEY must be a 64-character hexadecimal string
 * (32 bytes) to fulfil the aes-256-gcm key length requirement.
 */
if (!MASTER_KEY || !/^[0-9a-fA-F]{64}$/.test(MASTER_KEY)) {
  throw new Error(
    'SECRET_MANAGER_KEY env variable must be a 64-character hexadecimal string',
  );
}

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // AES-GCM recommended IV size
const KEY: Buffer = Buffer.from(MASTER_KEY, 'hex'); // 32-byte key

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
