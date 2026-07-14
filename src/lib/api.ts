// Shared API client for the admin console. Talks to the same backend
// the mobile app uses (default http://localhost:4000).
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "printhub_admin_token";

export const getToken = (): string =>
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) || "" : "";

export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  let relativePath = path;
  if (!relativePath.startsWith("/api/")) {
    relativePath = relativePath.startsWith("/") ? `/api${relativePath}` : `/api/${relativePath}`;
  }

  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${relativePath}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
      res.status
    );
  }
  return data as T;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "STUDENT" | "OPERATOR" | "ADMIN";
}

export const isConsoleRole = (role?: string) => role === "ADMIN" || role === "OPERATOR";
