import { pawningPaymentsApi } from "../api/accountCenterApi.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries AC commit after Pawning already committed (no Pawning reversal).
 * Env: AC_COMMIT_MAX_ATTEMPTS (default 5), AC_COMMIT_RETRY_BASE_MS (default 400, linear backoff).
 */
export async function commitPawningTicketPaymentsWithRetry(prepareToken, accessToken) {
  const maxAttempts = Math.max(
    1,
    Number(process.env.AC_COMMIT_MAX_ATTEMPTS) || 5,
  );
  const baseMs = Math.max(0, Number(process.env.AC_COMMIT_RETRY_BASE_MS) || 400);

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await pawningPaymentsApi.commitTicketPaymentsDoubleEntries(
        prepareToken,
        accessToken,
      );
    } catch (error) {
      lastError = error;
      const status = error?.status ?? error?.response?.status;

      if (status === 404) {
        throw error;
      }
      if (status >= 400 && status < 500 && status !== 429) {
        throw error;
      }
      if (attempt === maxAttempts) {
        break;
      }
      await sleep(baseMs * attempt);
    }
  }
  throw lastError;
}
