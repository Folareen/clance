import { NextResponse } from "next/server";
import { getRefreshToken, clearAuthCookies } from "@/lib/server/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST() {
  const rt = await getRefreshToken();

  if (rt) {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
    } catch {
    }
  }

  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
