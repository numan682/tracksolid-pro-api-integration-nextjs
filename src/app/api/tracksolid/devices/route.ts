import { NextResponse } from "next/server";
import { callTracksolid, defaultAccount, getAccessToken } from "@/lib/tracksolid";

export async function GET() {
  try {
    const token = await getAccessToken();
    const data = await callTracksolid(
      "jimi.user.device.list",
      {
        target: defaultAccount(),
      },
      { token },
    );

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load devices." },
      { status: 500 },
    );
  }
}
