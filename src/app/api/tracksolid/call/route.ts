import { NextRequest, NextResponse } from "next/server";
import { callTracksolid, defaultAccount, ensureToken } from "@/lib/tracksolid";
import { getSession, persistSessionToken } from "@/lib/session";
import { accountParamByMethod } from "@/lib/method-scope";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      method?: string;
      params?: Record<string, unknown>;
      refreshToken?: boolean;
    };

    if (!body.method) {
      return NextResponse.json({ ok: false, error: "Missing API method." }, { status: 400 });
    }

    const params = { ...(body.params ?? {}) };
    const accountParam = accountParamByMethod[body.method];
    if (accountParam && (params[accountParam] === undefined || params[accountParam] === "")) {
      params[accountParam] = session.account || defaultAccount();
    }

    const isTokenMethod = body.method === "jimi.oauth.token.get";

    let token = session.token;
    const cookieTokenValid =
      !body.refreshToken && token && session.tokenExp && session.tokenExp * 1000 > Date.now() + 60_000;

    if (!isTokenMethod && !cookieTokenValid) {
      // Refresh once (uses in-memory cache when warm) and persist back to the cookie.
      const fresh = await ensureToken(session.account, session.pwd, Boolean(body.refreshToken));
      token = fresh.token;
      await persistSessionToken(session, fresh.token, Math.floor(fresh.expiresAt / 1000));
    }

    const data = isTokenMethod
      ? await callTracksolid(body.method, params, { skipToken: true })
      : await callTracksolid(body.method, params, { token });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Tracksolid call failed." },
      { status: 500 },
    );
  }
}
