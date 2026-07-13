import { NextResponse } from "next/server";
import { getRefreshToken, clearAuthCookies } from "@/lib/server/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST() {
  const rt = await getRefreshToken();
  let revoked = true;

  if (rt) {
    try {
      const res = await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      revoked = res.ok;
    } catch {
      revoked = false;
    }
  }

  // Always clear local cookies so the client is logged out even if the
  // backend couldn't be reached; surface the revocation outcome so the
  // caller can warn the user their session may still be valid server-side.
  await clearAuthCookies();
  return NextResponse.json({ ok: true, revoked });
}
