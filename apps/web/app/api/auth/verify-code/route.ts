import { NextRequest } from "next/server";
import { forwardAuthRequest } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  return forwardAuthRequest(req, "/auth/verify-code", { setCookies: true });
}
