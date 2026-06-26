import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  return proxyToApi(`/search${qs}`, { auth: true });
}
