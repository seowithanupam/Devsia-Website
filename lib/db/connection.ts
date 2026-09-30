import "server-only";
import mongoose from "mongoose";
import { optionalEnv } from "@/lib/env";
import { shouldSkipAttempt } from "@/lib/db-utils/circuit";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not set.");
    this.name = "DatabaseNotConfiguredError";
  }
}

/** Thrown at once (no waiting) while the database is known to be unreachable. Callers fall back to built-in content. */
export class DatabaseUnavailableError extends Error {
  constructor(reason?: string) {
    super(reason ? `The database is unavailable (${reason}).` : "The database is unavailable.");
    this.name = "DatabaseUnavailableError";
  }
}

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  /** When the last connection attempt failed (ms since epoch), or null. */
  failedAt?: number | null;
  /** The error type of that failure (never the message or the connection string). */
  lastFailure?: string | null;
};

declare global {
  // Reused across hot reloads in development and across invocations on a warm serverless instance.
  var __devsiaMongoose: Cache | undefined;
}

const cache: Cache = (globalThis.__devsiaMongoose ??= { conn: null, promise: null, failedAt: null, lastFailure: null });

/**
 * Opens (or reuses) the MongoDB connection. The connection string is read here, on the server only, and is
 * never passed to client code. A single attempt waits at most 5 seconds.
 *
 * If an attempt fails, the next ones are refused immediately for 15 seconds (see lib/db-utils/circuit.ts) so a page
 * does not wait for a fresh timeout on every query while the database is down; after that pause one attempt is made
 * again. The same fast refusal applies while an established connection is lost and the driver is reconnecting.
 */
export async function connectDb(): Promise<typeof mongoose> {
  const uri = optionalEnv("MONGODB_URI");
  if (!uri) throw new DatabaseNotConfiguredError();

  if (cache.conn) {
    if (cache.conn.connection.readyState === 1) return cache.conn;
    throw new DatabaseUnavailableError("connection lost, the driver is reconnecting");
  }

  if (cache.promise === null && shouldSkipAttempt(cache.failedAt ?? null, Date.now())) {
    throw new DatabaseUnavailableError(cache.lastFailure ?? undefined);
  }

  cache.promise ??= mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });
  try {
    cache.conn = await cache.promise;
    cache.failedAt = null;
    cache.lastFailure = null;
  } catch (error) {
    cache.promise = null;
    cache.failedAt = Date.now();
    cache.lastFailure = error instanceof Error ? error.name : "unknown error";
    throw error;
  }
  return cache.conn;
}
