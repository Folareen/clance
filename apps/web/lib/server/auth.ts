import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  SESSION_HINT_COOKIE,
} from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function setAuthCookies(access_token: string, refresh_token: string) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, access_token, {
    ...COOKIE_OPTS,
    maxAge: 60 * 15,
  });
  jar.set(REFRESH_COOKIE, refresh_token, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_MAX_AGE,
  });
  jar.set(SESSION_HINT_COOKIE, "1", {
    httpOnly: false,
    secure: COOKIE_OPTS.secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(SESSION_HINT_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

async function readBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function jsonResponse(body: unknown, status: number) {
  if (status === 204 || status === 304) return new NextResponse(null, { status });
  return NextResponse.json(body, { status });
}

let refreshInFlight: Promise<{ access: string; refresh: string } | null> | null =
  null;

async function fetchNewTokens(
  refresh_token: string
): Promise<{ access: string; refresh: string } | null> {
  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { access: data.access_token, refresh: data.refresh_token };
}

export async function tryRefreshTokens(): Promise<boolean> {
  const rt = await getRefreshToken();
  if (!rt) return false;

  if (!refreshInFlight) {
    refreshInFlight = fetchNewTokens(rt).finally(() => {
      refreshInFlight = null;
    });
  }

  const tokens = await refreshInFlight;
  if (!tokens) return false;

  await setAuthCookies(tokens.access, tokens.refresh);
  return true;
}

export async function proxyRawToApi(
  path: string,
  options: { method?: string; body?: BodyInit; contentType?: string; auth?: boolean } = {}
) {
  const { method = "POST", body, contentType, auth = false } = options;

  const upstream = async (token?: string) => {
    const headers: Record<string, string> = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API}${path}`, { method, headers, body });
  };

  if (!auth) {
    const res = await upstream();
    return jsonResponse(await readBody(res), res.status);
  }

  let token = await getAccessToken();
  if (!token && (await tryRefreshTokens())) {
    token = await getAccessToken();
  }
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = await upstream(token);

  if (res.status === 401) {
    await clearAuthCookies();
    return NextResponse.json({ message: "Session expired" }, { status: 401 });
  }

  return jsonResponse(await readBody(res), res.status);
}

export async function proxyToApi(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
) {
  const { method = "GET", body, auth = false } = options;

  const upstream = async (token?: string) => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  if (!auth) {
    const res = await upstream();
    return jsonResponse(await readBody(res), res.status);
  }

  let token = await getAccessToken();
  if (!token && (await tryRefreshTokens())) {
    token = await getAccessToken();
  }
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let res = await upstream(token);

  if (res.status === 401) {
    if (await tryRefreshTokens()) {
      const newToken = await getAccessToken();
      if (newToken) {
        res = await upstream(newToken);
        return jsonResponse(await readBody(res), res.status);
      }
    }
    await clearAuthCookies();
    return NextResponse.json({ message: "Session expired" }, { status: 401 });
  }

  return jsonResponse(await readBody(res), res.status);
}
