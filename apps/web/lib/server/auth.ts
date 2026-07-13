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
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status: number) {
  if (status === 204 || status === 304) return new NextResponse(null, { status });
  return NextResponse.json(body, { status });
}

// Keyed by the caller's own refresh token so concurrent requests from the
// same session dedupe their refresh call, without ever handing one user's
// refreshed tokens to a different user's concurrent request.
const refreshInFlight = new Map<
  string,
  Promise<{ access: string; refresh: string } | null>
>();

async function fetchNewTokens(
  refresh_token: string
): Promise<{ access: string; refresh: string } | null> {
  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) return null;
  try {
    const data = await res.json();
    if (!data?.access_token || !data?.refresh_token) return null;
    return { access: data.access_token, refresh: data.refresh_token };
  } catch {
    return null;
  }
}

export async function tryRefreshTokens(): Promise<boolean> {
  const rt = await getRefreshToken();
  if (!rt) return false;

  let pending = refreshInFlight.get(rt);
  if (!pending) {
    pending = fetchNewTokens(rt).finally(() => {
      refreshInFlight.delete(rt);
    });
    refreshInFlight.set(rt, pending);
  }

  const tokens = await pending;
  if (!tokens) return false;

  await setAuthCookies(tokens.access, tokens.refresh);
  return true;
}

/**
 * For the simple unauthenticated auth flows (login/signup/etc.): forwards the
 * request body to the backend and, on success, optionally sets auth cookies.
 * Guards JSON parsing on both ends so a malformed client body or a non-JSON
 * upstream error (e.g. a gateway timeout returning an HTML page) can't throw
 * an unhandled exception out of the route handler.
 */
export async function forwardAuthRequest(
  req: Request,
  backendPath: string,
  options: { setCookies?: boolean } = {}
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const res = await fetch(`${API}${backendPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await readBody(res);
  if (!res.ok) {
    return NextResponse.json(data ?? { message: "Request failed" }, { status: res.status });
  }

  if (options.setCookies) {
    const parsed = data as { access_token?: string; refresh_token?: string; user?: unknown } | null;
    if (!parsed?.access_token || !parsed?.refresh_token) {
      return NextResponse.json({ message: "Unexpected response from server" }, { status: 502 });
    }
    await setAuthCookies(parsed.access_token, parsed.refresh_token);
    return NextResponse.json({ user: parsed.user });
  }

  return NextResponse.json(data, { status: res.status });
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
