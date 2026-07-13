const ADMIN_COOKIE_NAME = "amaro_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type AdminSession = {
  role: "admin";
  expiresAt: number;
};

function toBase64Url(value: string | ArrayBuffer): string {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return toBase64Url(signature);
}

export async function createAdminSessionToken(secret: string): Promise<string> {
  const session: AdminSession = {
    role: "admin",
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const payload = toBase64Url(JSON.stringify(session));
  return `${payload}.${await sign(payload, secret)}`;
}

export async function isValidAdminSession(
  token: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !secret) return false;

  const [payload, receivedSignature, extra] = token.split(".");
  if (!payload || !receivedSignature || extra) return false;

  const expectedSignature = await sign(payload, secret);
  if (receivedSignature !== expectedSignature) return false;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const session = JSON.parse(decoded) as Partial<AdminSession>;

    return (
      session.role === "admin" &&
      typeof session.expiresAt === "number" &&
      session.expiresAt > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export const adminSessionCookie = {
  name: ADMIN_COOKIE_NAME,
  maxAge: SESSION_DURATION_SECONDS,
};
