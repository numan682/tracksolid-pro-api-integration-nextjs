import "server-only";

import crypto from "node:crypto";

const API_URL = process.env.TRACKSOLID_API_URL ?? "https://hk-open.tracksolidpro.com/route/rest";
const APP_KEY = process.env.TRACKSOLID_APP_KEY ?? "";
const APP_SECRET = process.env.TRACKSOLID_APP_SECRET ?? "";
const ACCOUNT = process.env.TRACKSOLID_ACCOUNT ?? "";
const PASSWORD = process.env.TRACKSOLID_PASSWORD ?? "";

type TokenEntry = {
  value: string;
  expiresAt: number;
  pwd: string;
};

// Access tokens are cached per Tracksolid account so multiple signed-in users
// don't share or clobber each other's credentials.
const tokenCache = new Map<string, TokenEntry>();

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function md5(value: string) {
  return crypto.createHash("md5").update(value, "utf8").digest("hex").toUpperCase();
}

export function normalizePassword(password: string) {
  return /^[a-f0-9]{32}$/i.test(password) ? password.toLowerCase() : md5(password).toLowerCase();
}

function serializeValue(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function sign(params: Record<string, string>) {
  const sorted = Object.keys(params)
    .filter((key) => key !== "sign" && params[key] !== "")
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  return md5(`${APP_SECRET}${sorted}${APP_SECRET}`);
}

export type TracksolidResponse<T = unknown> = {
  code?: number | string;
  message?: string;
  msg?: string;
  result?: T;
  data?: T;
  [key: string]: unknown;
};

export async function callTracksolid<T = unknown>(
  method: string,
  params: Record<string, unknown> = {},
  options: { token?: string; skipToken?: boolean; retries?: number } = {},
) {
  if (!APP_KEY || !APP_SECRET) {
    throw new Error("Tracksolid app key and app secret are not configured.");
  }

  const payload: Record<string, string> = {
    app_key: APP_KEY,
    format: "json",
    method,
    sign_method: "md5",
    timestamp: timestamp(),
    v: "1.0",
  };

  for (const [key, value] of Object.entries(params)) {
    const serialized = serializeValue(value);
    if (serialized !== "") payload[key] = serialized;
  }

  if (!options.skipToken && options.token) {
    payload.access_token = options.token;
  }

  payload.sign = sign(payload);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams(payload),
    cache: "no-store",
  });

  const text = await response.text();
  let json: TracksolidResponse<T>;

  try {
    json = JSON.parse(text) as TracksolidResponse<T>;
  } catch {
    throw new Error(`Tracksolid returned a non-JSON response: ${text.slice(0, 240)}`);
  }

  if (!response.ok) {
    throw new Error(json.message ?? json.msg ?? `Tracksolid HTTP ${response.status}`);
  }

  // Tracksolid throttles aggressively (code 1006). Back off briefly and retry once.
  if (String(json.code) === "1006" && options.retries !== 0) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return callTracksolid<T>(method, params, { ...options, retries: 0 });
  }

  if (json.code !== undefined && String(json.code) !== "0") {
    const message = json.message ?? json.msg ?? `Tracksolid error code ${json.code}`;
    if (String(message).includes("AppKey")) {
      throw new Error(
        `${message}. Tracksolid rejected TRACKSOLID_APP_KEY; confirm the Open API credential is active and belongs to the configured API node.`,
      );
    }

    throw new Error(message);
  }

  return json;
}

type TokenResult = { token: string; name: string; expiresIn: number };

async function requestToken(account: string, pwdMd5: string): Promise<TokenResult> {
  const json = await callTracksolid<Record<string, unknown>>(
    "jimi.oauth.token.get",
    {
      user_id: account,
      user_pwd_md5: pwdMd5,
      expires_in: "7200",
    },
    { skipToken: true },
  );

  const source = (json.result ?? json.data ?? json) as Record<string, unknown>;
  const token = source.accessToken ?? source.access_token ?? source.token;

  if (typeof token !== "string" || token.length === 0) {
    throw new Error(json.message ?? json.msg ?? "Tracksolid did not return an access token.");
  }

  const name = String(source.nick ?? source.nickName ?? source.account ?? account);
  const expiresIn = Number(source.expiresIn ?? source.expires_in ?? 7200);

  return { token, name, expiresIn };
}

/**
 * Validate raw credentials against Tracksolid and prime the token cache.
 * Throws if the credentials are rejected. Returns identity + token to persist.
 */
export async function authenticate(account: string, password: string) {
  const pwd = normalizePassword(password);
  const { token, name, expiresIn } = await requestToken(account, pwd);
  const expiresAt = Date.now() + Math.max(expiresIn - 120, 60) * 1000;

  tokenCache.set(account, { value: token, pwd, expiresAt });

  return { account, name, pwd, token, tokenExp: Math.floor(expiresAt / 1000) };
}

/** Get a valid access token + absolute expiry for an account, refreshing only when needed. */
export async function ensureToken(account: string, pwdMd5: string, force = false) {
  const cached = tokenCache.get(account);
  if (!force && cached && cached.expiresAt > Date.now() + 60_000 && cached.pwd === pwdMd5) {
    return { token: cached.value, expiresAt: cached.expiresAt };
  }

  const { token, expiresIn } = await requestToken(account, pwdMd5);
  const expiresAt = Date.now() + Math.max(expiresIn - 120, 60) * 1000;
  tokenCache.set(account, { value: token, pwd: pwdMd5, expiresAt });

  return { token, expiresAt };
}

/** Get a valid access token for a specific account, refreshing with its md5 password if needed. */
export async function getAccessTokenForAccount(account: string, pwdMd5: string, force = false) {
  const { token } = await ensureToken(account, pwdMd5, force);
  return token;
}

/** Legacy env-credential token, used by unauthenticated/system routes. */
export async function getAccessToken(force = false) {
  if (!ACCOUNT || !PASSWORD) {
    throw new Error("Tracksolid account and password are not configured.");
  }
  return getAccessTokenForAccount(ACCOUNT, normalizePassword(PASSWORD), force);
}

export function defaultAccount() {
  return ACCOUNT;
}
