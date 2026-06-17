export function isAdminSyncAuthorized(request: Request): boolean {
  const expectedToken = (process.env.AMARO_ADMIN_SYNC_TOKEN || "").trim();
  const receivedToken = request.headers.get("x-amaro-admin-token")?.trim() ?? "";

  if (!expectedToken || !receivedToken) {
    return false;
  }

  return receivedToken === expectedToken;
}
