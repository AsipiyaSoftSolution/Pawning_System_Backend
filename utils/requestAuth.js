/**
 * Resolve the JWT used for Account Center API calls.
 * Prefer req.accessToken (set by auth middleware from Authorization header or cookie).
 */
export function getRequestAccessToken(req) {
  return (
    req?.accessToken ||
    req?.cookies?.accessToken ||
    req?.headers?.authorization?.split(" ")?.[1] ||
    null
  );
}
