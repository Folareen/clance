import { NextResponse } from "next/server";
import { getAccessToken, tryRefreshTokens } from "@/lib/server/auth";

export async function GET() {
  let token = await getAccessToken();

  if (!token && (await tryRefreshTokens())) {
    token = await getAccessToken();
  }

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ token });
}
