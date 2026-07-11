import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => undefined);
  return proxyToApi("/push/subscribe", { method: "POST", body, auth: true });
}
