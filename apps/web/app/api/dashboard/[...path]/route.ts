import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/auth";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const qs = req.nextUrl.search;
  const apiPath = `/dashboard/${path.join("/")}${qs}`;

  let body: unknown;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.json().catch(() => undefined);
  }

  return proxyToApi(apiPath, { method: req.method, body, auth: true });
}

export const GET = handler;
export const POST = handler;
