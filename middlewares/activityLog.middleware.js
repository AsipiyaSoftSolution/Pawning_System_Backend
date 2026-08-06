import createActivityLog from "../utils/activityLog.js";
import {
  resolveActivityAction,
  shouldSkipActivityLog,
} from "../utils/activityLogActions.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Wrap res.json so every authenticated mutating API response writes an
 * activity log (Account Center–style fire-and-forget). Controllers may set:
 *   req.activityLogAction    – override human-readable action
 *   req.activityLogMetadata  – extra metadata merged into the log
 *   req.skipActivityLog      – skip logging for this request
 */
export const activityLogMiddleware = (req, res, next) => {
  if (!MUTATING_METHODS.has(String(req.method || "").toUpperCase())) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    try {
      if (req.userId && !shouldSkipActivityLog(req)) {
        const statusCode = res.statusCode || 200;
        const failed =
          statusCode >= 400 ||
          body?.success === false ||
          (body && body.error && body.success !== true);

        const metadata = {
          method: req.method,
          path: (req.originalUrl || req.url || "").split("?")[0],
          companyId: req.companyId ?? null,
          branchId:
            req.branchId ??
            req.params?.branchId ??
            req.params?.id ??
            null,
          statusCode,
          ...(req.activityLogMetadata &&
          typeof req.activityLogMetadata === "object"
            ? req.activityLogMetadata
            : {}),
        };

        // Do not await — never block the response
        createActivityLog(
          req.userId,
          resolveActivityAction(req),
          failed ? "FAILURE" : "SUCCESS",
          metadata,
          req,
        );
      }
    } catch (err) {
      console.log("[activityLogMiddleware] failed to queue log", err);
    }

    return originalJson(body);
  };

  next();
};
