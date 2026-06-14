import "server-only";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  seal,
  unseal,
  type SessionData,
} from "@/lib/session-crypto";

export type { SessionData } from "@/lib/session-crypto";
export { SESSION_COOKIE_NAME } from "@/lib/session-crypto";

export async function createSession(data: Omit<SessionData, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = seal({ ...data, exp });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  return unseal(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

/** Update only the cached Tracksolid token on an existing session cookie. */
export async function persistSessionToken(base: SessionData, token: string, tokenExp: number) {
  const cookieStore = await cookies();
  const maxAge = Math.max(base.exp - Math.floor(Date.now() / 1000), 60);
  cookieStore.set(SESSION_COOKIE_NAME, seal({ ...base, token, tokenExp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
