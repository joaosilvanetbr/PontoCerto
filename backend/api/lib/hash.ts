/**
 * Password Hashing - PontoCerto Security Module
 *
 * Uses bcryptjs for password hashing with:
 * - Salt rounds: 10 (balanced for security/performance on Workers)
 * - Async hash/verify
 */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
