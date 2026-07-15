import bcrypt from "bcryptjs";
import {
  upsertUser,
  getUserByOpenId,
  getEmailCredentialByEmail,
  createEmailCredential,
  setEmailCredentialLock,
} from "./db";

/**
 * Classic email + password auth, layered on top of the existing user/session
 * model. Passwords are bcrypt-hashed and stored in `email_credentials`. On
 * success we reuse the existing session (the caller mints the app_session_id
 * JWT cookie). Errors are intentionally generic to avoid user enumeration.
 */

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
// Dummy hash used to keep timing similar when an email is not found.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvY0m1F0Z0zPqZ8Zq1qE9xq1qE9x";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function openIdForEmail(email: string): string {
  return `email:${normalizeEmail(email)}`;
}

export class EmailAuthError extends Error {
  constructor(public reason: "EMAIL_TAKEN" | "INVALID_CREDENTIALS" | "LOCKED" | "FAILED") {
    super(reason);
  }
}

export async function registerEmailUser(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ openId: string; name: string }> {
  const email = normalizeEmail(input.email);

  const existing = await getEmailCredentialByEmail(email);
  if (existing) throw new EmailAuthError("EMAIL_TAKEN");

  const openId = openIdForEmail(email);
  const name = input.name?.trim() || email.split("@")[0];

  await upsertUser({ openId, name, email, loginMethod: "email", lastSignedIn: new Date() });
  const user = await getUserByOpenId(openId);
  if (!user) throw new EmailAuthError("FAILED");

  const passwordHash = await bcrypt.hash(input.password, 10);
  await createEmailCredential({ userId: user.id, email, passwordHash });

  return { openId, name };
}

export async function loginEmailUser(input: {
  email: string;
  password: string;
}): Promise<{ openId: string; name: string }> {
  const email = normalizeEmail(input.email);
  const cred = await getEmailCredentialByEmail(email);

  if (!cred) {
    // Compare against a dummy hash to reduce timing signal, then fail generically.
    await bcrypt.compare(input.password, DUMMY_HASH).catch(() => false);
    throw new EmailAuthError("INVALID_CREDENTIALS");
  }

  if (cred.lockedUntil && new Date(cred.lockedUntil).getTime() > Date.now()) {
    throw new EmailAuthError("LOCKED");
  }

  const ok = await bcrypt.compare(input.password, cred.passwordHash);
  if (!ok) {
    const attempts = (cred.failedAttempts || 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MS) : null;
    await setEmailCredentialLock(email, attempts, lockedUntil).catch(() => {});
    throw new EmailAuthError("INVALID_CREDENTIALS");
  }

  // Success: clear any failed-attempt state and refresh lastSignedIn.
  if (cred.failedAttempts || cred.lockedUntil) {
    await setEmailCredentialLock(email, 0, null).catch(() => {});
  }
  const openId = openIdForEmail(email);
  await upsertUser({ openId, lastSignedIn: new Date() }).catch(() => {});
  const user = await getUserByOpenId(openId);

  return { openId, name: user?.name || email.split("@")[0] };
}
