import { NextRequest } from "next/server";
import { forwardAuthRequest } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  return forwardAuthRequest(req, "/projects/accept-invite/signup", { setCookies: true });
}
