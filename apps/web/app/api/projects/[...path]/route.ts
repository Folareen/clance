import { NextRequest } from "next/server";
import { proxyToApi, proxyRawToApi } from "@/lib/server/auth";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const qs = req.nextUrl.search;
  const apiPath = `/projects/${path.join("/")}${qs}`;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const rawBody = await req.arrayBuffer();
    return proxyRawToApi(apiPath, {
      method: req.method,
      body: Buffer.from(rawBody),
      contentType,
      auth: true,
    });
  }

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
