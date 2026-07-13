import { NextRequest } from "next/server";
import { forwardAuthRequest } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  return forwardAuthRequest(req, "/auth/signup", { setCookies: true });
}
