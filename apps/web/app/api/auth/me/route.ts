import { proxyToApi } from "@/lib/server/auth";

export async function GET() {
  return proxyToApi("/auth/me", { auth: true });
}
