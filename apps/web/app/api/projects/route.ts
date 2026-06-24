import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/auth";

export async function GET() {
  return proxyToApi("/projects", { auth: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyToApi("/projects", { method: "POST", body, auth: true });
}
