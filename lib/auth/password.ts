import "server-only";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/auth/password-policy";

/** bcrypt hash with 12 rounds. PROPOSAL: the original hashing algorithm was not recorded. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummy: Promise<string> | null = null;
/** A throwaway hash, so a wrong email takes as long as a wrong password (no account enumeration by timing). */
export function dummyHash(): Promise<string> {
  dummy ??= bcrypt.hash("not-a-real-password", BCRYPT_ROUNDS);
  return dummy;
}
