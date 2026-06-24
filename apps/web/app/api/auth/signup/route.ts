import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/server/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  await setAuthCookies(data.access_token, data.refresh_token);
  return NextResponse.json({ user: data.user });
}
