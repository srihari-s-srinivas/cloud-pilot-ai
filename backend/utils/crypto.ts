import crypto from 'crypto';

// The IV (Initialization Vector) must be randomly generated for each encryption operation.
// This prevents pattern detection (semantic security), meaning that encrypting the same text
// multiple times will always result in different ciphertexts, neutralizing replay or frequency analysis attacks.
const ALGORITHM = 'aes-256-cbc';
const SALT = 'cloudpilot-salt';

function getKey(): Buffer {
  if (!process.env.JWT_SECRET) throw new Error('FATAL: JWT_SECRET required');
  const secret = process.env.JWT_SECRET;
  return crypto.scryptSync(secret, SALT, 32);
}

export function encryptSecret(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptSecret(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted format. Expected ivhex:ciphertexthex');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
