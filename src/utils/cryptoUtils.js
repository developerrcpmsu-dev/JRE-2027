/**
 * Security & Cryptographic Utilities
 * Compliant with web application security standards:
 * - SHA-256 with Cryptographic Salt for Password Hashing
 * - Password Verification
 * - Input Validation & Sanitization
 */

// Generate a random cryptographic salt (hex string)
export function generateSalt(length = 16) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash password with Salt using Web Crypto API SHA-256
 * @param {string} password - plain text password
 * @param {string} salt - random salt string
 * @returns {Promise<string>} - hex encoded hash
 */
export async function hashPassword(password, salt) {
  if (!password) return '';
  const textEncoder = new TextEncoder();
  const saltedData = textEncoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', saltedData);
  return bufferToHex(hashBuffer);
}

/**
 * Verify whether plain password matches stored hash and salt
 * @param {string} password 
 * @param {string} storedHash 
 * @param {string} salt 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash, salt) {
  if (!password || !storedHash || !salt) return false;
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}

/**
 * Generate 6-digit OTP code for email verification & password reset
 */
export function generateVerificationCode() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (array[0] % 900000) + 100000;
  return code.toString();
}

/**
 * Validate email address format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password requirements (minimum 6 characters)
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') return { valid: false, message: 'กรุณาระบุรหัสผ่าน' };
  if (password.length < 6) {
    return { valid: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }
  return { valid: true, message: '' };
}
