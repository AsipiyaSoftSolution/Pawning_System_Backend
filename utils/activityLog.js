import { pool } from "./db.js";

/**
 * Map free-form status strings to the values accepted by
 * `activity_logs.status` which is ENUM('SUCCESS','FAILURE','PENDING').
 */
function normalizeActivityLogStatus(status) {
  const raw = String(status ?? "").trim().toLowerCase();
  if (!raw) return "SUCCESS";
  if (
    [
      "success",
      "succeed",
      "succeeded",
      "ok",
      "done",
      "completed",
      "complete",
    ].includes(raw)
  ) {
    return "SUCCESS";
  }
  if (
    [
      "failure",
      "failed",
      "fail",
      "error",
      "errored",
      "rejected",
      "reject",
      "partial",
    ].includes(raw)
  ) {
    return "FAILURE";
  }
  if (["pending", "in_progress", "in-progress", "queued"].includes(raw)) {
    return "PENDING";
  }
  return "SUCCESS";
}

/**
 * Fire-and-forget activity log insert (never throws to callers).
 * Mirrors Account Center `createActivityLog` contract.
 */
const createActivityLog = async (userId, action, status, metadata, req) => {
  try {
    if (userId == null) {
      console.warn(
        "[activityLog] Skipping log insert because userId is missing",
        { action, status },
      );
      return null;
    }

    const query = `
      INSERT INTO activity_logs (
        user_id,
        action,
        status,
        metadata,
        ip_address,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      String(userId),
      action,
      normalizeActivityLogStatus(status),
      metadata != null ? JSON.stringify(metadata) : null,
      req?.ip || null,
      req?.get ? req.get("user-agent") : null,
    ]);

    return result;
  } catch (error) {
    console.log("Error in activity logs", error);
  }
};

export default createActivityLog;
export { normalizeActivityLogStatus };
