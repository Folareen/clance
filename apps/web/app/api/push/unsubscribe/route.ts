import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/auth";

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => undefined);
  return proxyToApi("/push/unsubscribe", { method: "DELETE", body, auth: true });
}
