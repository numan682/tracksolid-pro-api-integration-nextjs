import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { callTracksolid, defaultAccount, getAccessTokenForAccount } from "@/lib/tracksolid";
import { accountParamByMethod } from "@/lib/method-scope";

/**
 * Verify the request has a valid session. Memoized per render pass.
 * Redirects to /login when unauthenticated.
 */
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
});

/** Like verifySession but returns null instead of redirecting (for optional checks). */
export const getOptionalSession = cache(async () => getSession());

/**
 * Run a Tracksolid API method on behalf of the currently signed-in account.
 * Centralizes auth + token refresh + account scoping for every request.
 */
export async function callForSession(method: string, params: Record<string, unknown> = {}, refreshToken = false) {
  const session = await verifySession();
  const token = await getAccessTokenForAccount(session.account, session.pwd, refreshToken);

  const finalParams = { ...params };
  const accountParam = accountParamByMethod[method];
  if (accountParam && (finalParams[accountParam] === undefined || finalParams[accountParam] === "")) {
    finalParams[accountParam] = session.account || defaultAccount();
  }

  const isTokenMethod = method === "jimi.oauth.token.get";
  return isTokenMethod
    ? callTracksolid(method, finalParams, { skipToken: true })
    : callTracksolid(method, finalParams, { token });
}
