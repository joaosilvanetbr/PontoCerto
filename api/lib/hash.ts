/**
 * Password Hashing - PontoCerto Security Module
 *
 * Uses bcryptjs for PIN hashing with:
 * - Salt rounds: 10 (balanced for security/performance on Workers)
 * - Async hash/verify
 */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
