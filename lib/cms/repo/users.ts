import "server-only";
import type { Role } from "@/lib/auth/capabilities";
import { getDb } from "@/lib/db";
import { UserModel, type UserDoc } from "@/lib/db/models";
import type { UserRecord } from "@/lib/cms/types";

/** The only place that hands out password hashes. Never return this type to a page or client component. */
export type UserWithSecret = UserRecord & { passwordHash: string; failedAttempts: number; lockedUntil: Date | null };

function toRecord(doc: UserDoc): UserRecord {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    active: doc.active,
    mustChangePassword: doc.mustChangePassword,
    sessionVersion: doc.sessionVersion ?? 0,
    lastLoginAt: doc.lastLoginAt ? doc.lastLoginAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function findUserWithSecretByEmail(email: string): Promise<UserWithSecret | null> {
  await getDb();
  const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean<UserDoc>();
  return doc ? { ...toRecord(doc), passwordHash: doc.passwordHash, failedAttempts: doc.failedAttempts ?? 0, lockedUntil: doc.lockedUntil ?? null } : null;
}

export async function findUserWithSecretById(id: string): Promise<UserWithSecret | null> {
  await getDb();
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const doc = await UserModel.findById(id).lean<UserDoc>();
  return doc ? { ...toRecord(doc), passwordHash: doc.passwordHash, failedAttempts: doc.failedAttempts ?? 0, lockedUntil: doc.lockedUntil ?? null } : null;
}

export async function getUser(id: string): Promise<UserRecord | null> {
  await getDb();
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  const doc = await UserModel.findById(id).lean<UserDoc>();
  return doc ? toRecord(doc) : null;
}

export async function listUsers(): Promise<UserRecord[]> {
  await getDb();
  const docs = await UserModel.find({}).sort({ createdAt: 1 }).lean<UserDoc[]>();
  return docs.map(toRecord);
}

export async function countActiveSuperAdmins(): Promise<number> {
  await getDb();
  return UserModel.countDocuments({ role: "super_admin", active: true });
}

export async function createUser(input: { name: string; email: string; role: Role; passwordHash: string; mustChangePassword: boolean }): Promise<UserRecord> {
  await getDb();
  const doc = await UserModel.create({ ...input, active: true, failedAttempts: 0, lockedUntil: null });
  return toRecord(doc.toObject() as UserDoc);
}

export async function updateUserAccess(id: string, patch: { role?: Role; active?: boolean }): Promise<UserRecord | null> {
  await getDb();
  const doc = await UserModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean<UserDoc>();
  return doc ? toRecord(doc) : null;
}

export async function updateUserName(id: string, name: string): Promise<void> {
  await getDb();
  await UserModel.updateOne({ _id: id }, { $set: { name } });
}

/**
 * Sets a new password hash and clears any lockout. `mustChange` is true for admin-issued temporary passwords.
 * It also raises the session version, which signs the person out everywhere they are still signed in.
 */
export async function setUserPassword(id: string, passwordHash: string, mustChange: boolean): Promise<void> {
  await getDb();
  await UserModel.updateOne({ _id: id }, { $set: { passwordHash, mustChangePassword: mustChange, failedAttempts: 0, lockedUntil: null }, $inc: { sessionVersion: 1 } });
}

export async function recordLoginFailure(id: string, state: { failedAttempts: number; lockedUntil: Date | null }): Promise<void> {
  await getDb();
  await UserModel.updateOne({ _id: id }, { $set: { failedAttempts: state.failedAttempts, lockedUntil: state.lockedUntil } });
}

export async function recordLoginSuccess(id: string): Promise<void> {
  await getDb();
  await UserModel.updateOne({ _id: id }, { $set: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });
}
