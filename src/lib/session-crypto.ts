import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "tsp_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionData = {
  /** Tracksolid account id used as the identity. */
  account: string;
  /** Display name for the signed-in user. */
  name: string;
  /** md5 of the account password, used to refresh the Tracksolid token. */
  pwd: string;
  /** Cached Tracksolid access token, to avoid re-hitting the throttled token endpoint. */
  token?: string;
  /** Unix epoch (seconds) when the cached access token expires. */
  tokenExp?: number;
  /** Unix epoch (seconds) when the session expires. */
  exp: number;
};

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  // Derive a stable 32-byte key from the configured secret.
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

/** Encrypt a payload into a compact, URL-safe token (AES-256-GCM). */
export function seal(data: SessionData) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

/** Decrypt a token produced by {@link seal}. Returns null on tamper/expiry. */
export function unseal(token: string | undefined): SessionData | null {
  if (!token) return null;

  try {
    const [ivPart, tagPart, dataPart] = token.split(".");
    if (!ivPart || !tagPart || !dataPart) return null;

    const key = getKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]);
    const data = JSON.parse(decrypted.toString("utf8")) as SessionData;

    if (typeof data.exp !== "number" || data.exp * 1000 < Date.now()) return null;

    return data;
  } catch {
    return null;
  }
}
