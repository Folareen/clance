import { SESSION_HINT_COOKIE } from "@/lib/constants";

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type Role = "manager" | "worker";
export type MemberStatus = "pending" | "active";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  role?: Role;
  label?: string | null;
}

export interface Member {
  id: string;
  user_id: string | null;
  email: string;
  role: Role;
  label: string | null;
  status: MemberStatus;
  joined_at: string | null;
}

export interface ProjectDetail extends Project {
  members: Member[];
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function hasSessionHint(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${SESSION_HINT_COOKIE}=`));
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText;
  try {
    const data = await res.json();
    message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || message;
  } catch {
  }
  return new ApiError(message, res.status);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  login: (b: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", body: b }),

  signup: (b: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => request<{ user: User }>("/api/auth/signup", { method: "POST", body: b }),

  logout: () => request<void>("/api/auth/logout", { method: "POST" }),

  me: () => request<User>("/api/auth/me"),

  requestReset: (email: string) =>
    request<{ message: string }>("/api/auth/request-reset", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: { token, new_password },
    }),

  listProjects: () => request<Project[]>("/api/projects"),

  getProject: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),

  createProject: (b: { name: string; description?: string }) =>
    request<Project>("/api/projects", { method: "POST", body: b }),

  updateProject: (id: string, b: { name?: string; description?: string }) =>
    request<Project>(`/api/projects/${id}`, { method: "PATCH", body: b }),

  deleteProject: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: "DELETE" }),

  inviteMember: (id: string, b: { email: string; role: Role; label?: string }) =>
    request<void>(`/api/projects/${id}/invite`, { method: "POST", body: b }),

  updateMember: (id: string, memberId: string, b: { role?: Role; label?: string }) =>
    request<void>(`/api/projects/${id}/members/${memberId}`, {
      method: "PATCH",
      body: b,
    }),

  removeMember: (id: string, memberId: string) =>
    request<void>(`/api/projects/${id}/members/${memberId}`, { method: "DELETE" }),

  leaveProject: (id: string) =>
    request<void>(`/api/projects/${id}/leave`, { method: "POST" }),

  acceptInvite: (token: string) =>
    request<{ message: string }>("/api/projects/accept-invite", {
      method: "POST",
      body: { token },
    }),

  acceptInviteWithSignup: (b: {
    token: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) =>
    request<{ user: User }>("/api/auth/accept-invite-signup", {
      method: "POST",
      body: b,
    }),
};
