import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/tracksolid";

export async function GET() {
  try {
    const token = await getAccessToken(true);

    return NextResponse.json({ ok: true, authenticated: Boolean(token) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to create token" },
      { status: 500 },
    );
  }
}
