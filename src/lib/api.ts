/** Client-side helper for invoking Tracksolid methods through the authenticated proxy route. */
export async function callApi<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch("/api/tracksolid/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });

  let json: { ok?: boolean; data?: T; error?: string };
  try {
    json = await response.json();
  } catch {
    throw new Error(`Request failed (${response.status})`);
  }

  if (response.status === 401) {
    // Session expired — bounce to login.
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok || !json.ok) {
    throw new Error(json.error ?? "Request failed");
  }

  return json.data as T;
}
