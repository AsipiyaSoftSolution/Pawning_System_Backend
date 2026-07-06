import crypto from "crypto";
import { errorHandler } from "./errorHandler.js";

export const SESSION_SUPERSEDED_CODE = "SESSION_SUPERSEDED";

export function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

export async function rotateUserSession(db, userId) {
  const sessionId = generateSessionId();
  await db.query("UPDATE user SET auth_session_id = ? WHERE idUser = ?", [
    sessionId,
    userId,
  ]);
  return sessionId;
}

export async function getUserSessionId(db, userId) {
  const [rows] = await db.query(
    "SELECT auth_session_id FROM user WHERE idUser = ? LIMIT 1",
    [userId],
  );
  return rows[0]?.auth_session_id ?? null;
}

/**
 * When auth_session_id is NULL (pre-migration / never logged in since deploy),
 * allow legacy tokens without sid. After first login, sid is enforced.
 */
export function isSessionValid(storedSessionId, tokenSessionId) {
  if (!storedSessionId) {
    return true;
  }
  if (!tokenSessionId) {
    return false;
  }
  return storedSessionId === tokenSessionId;
}

export function sessionSupersededError() {
  const error = errorHandler(
    401,
    "Your account was signed in on another device. Please sign in again.",
  );
  error.code = SESSION_SUPERSEDED_CODE;
  return error;
}
