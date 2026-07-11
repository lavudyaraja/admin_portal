const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("ph_admin_token") || "";
}
export function setToken(t: string) {
  localStorage.setItem("ph_admin_token", t);
}
export function clearToken() {
  localStorage.removeItem("ph_admin_token");
}

export type AdminUser = { role: string; name: string; phone?: string; email?: string | null };

export async function apiLogin(phone: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data as { token: string; user: AdminUser };
}

export async function apiRegisterAdmin(body: {
  name: string; phone: string; email?: string; password: string; adminCode: string;
}) {
  const res = await fetch(`${API}/api/auth/register-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data as { token: string; user: AdminUser };
}

export async function api<T = any>(path: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  const res = await fetch(`${API}/api${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 || res.status === 403) {
    clearToken();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed");
  return res.json();
}
