import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hashes a password using PBKDF2-like approach with SHA-256
 * In production, consider using bcrypt or argon2 via a worker
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const iterations = 100000;

  // Use Web Crypto API for edge compatibility
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hash = Buffer.from(derivedBits).toString('hex');
  return `${salt}:${iterations}:${hash}`;
}

/**
 * Verifies a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, iterationsStr, hash] = storedHash.split(':');
  const iterations = parseInt(iterationsStr, 10);

  if (!salt || !iterations || !hash) {
    return false;
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const computedHash = Buffer.from(derivedBits).toString('hex');

  // Timing-safe comparison
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Generates a random temporary password
 * Format: 3 letters + 4 numbers + 3 letters (e.g., "ABC1234XYZ")
 */
export function generateTemporaryPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O to avoid confusion
  const numbers = '0123456789';

  let password = '';

  // First 3 letters
  for (let i = 0; i < 3; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }

  // 4 numbers
  for (let i = 0; i < 4; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  // Last 3 letters
  for (let i = 0; i < 3; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }

  return password;
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
