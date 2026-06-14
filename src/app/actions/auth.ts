"use server";

import { redirect } from "next/navigation";
import { authenticate } from "@/lib/tracksolid";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

/** Map common Tracksolid (JIMI) error messages — often Chinese — to clear English. */
function friendlyAuthError(message: string): string {
  const map: { match: RegExp; text: string }[] = [
    { match: /频率过高|frequency|too\s*(high|many|frequent)|rate.?limit|1006/i, text: "Too many sign-in attempts. Please wait a minute and try again." },
    { match: /非法用户|illegal user|invalid user|密码错误|password|incorrect|wrong|1002/i, text: "Incorrect account or password." },
    { match: /不存在|not.*exist|NullPointer|500/i, text: "Account not found on this Tracksolid server node." },
    { match: /AppKey|app_key|sign/i, text: "API credentials are misconfigured on the server." },
    { match: /账号被禁用|disabled|locked|冻结/i, text: "This account is disabled or locked on Tracksolid." },
  ];
  const hit = map.find((entry) => entry.match.test(message));
  return hit ? hit.text : message || "Sign in failed.";
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const account = String(formData.get("account") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!account || !password) {
    return { error: "Enter both an account and password." };
  }

  let identity;
  try {
    identity = await authenticate(account, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed.";
    return { error: friendlyAuthError(message) };
  }

  await createSession({
    account: identity.account,
    name: identity.name,
    pwd: identity.pwd,
    token: identity.token,
    tokenExp: identity.tokenExp,
  });
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
