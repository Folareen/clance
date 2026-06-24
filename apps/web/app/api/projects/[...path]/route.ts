import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/server/auth";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const apiPath = `/projects/${path.join("/")}`;

  let body: unknown;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.json().catch(() => undefined);
  }

  return proxyToApi(apiPath, { method: req.method, body, auth: true });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
