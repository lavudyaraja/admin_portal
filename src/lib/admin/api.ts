// API client for the Prinsta admin console. Same backend as the vendor
// console and the mobile app, but a SEPARATE token key — an admin and a
// vendor must be able to be signed in side by side in one browser without
// clobbering each other's session.
const PROD_API = "https://backend-printhub.onrender.com";
const LOCAL_API = "http://localhost:4000";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    ? LOCAL_API
    : PROD_API);
import { saveSession, readSession, clearSession } from "@/lib/session";

export const getToken = (): string => readSession("admin");

/** `remember` picks the session length — see lib/session.ts. */
export const setToken = (t: string, remember = false) => saveSession("admin", t, remember);

export const clearToken = () => clearSession("admin");

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

export interface OperatorUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "STUDENT" | "OPERATOR" | "ADMIN";
}

/**
 * The admin console is the PLATFORM control plane, so it admits ADMIN only.
 * OPERATOR is the shop-owner role and belongs to the vendor console — letting
 * one in here would show them every vendor's data.
 */
export const isOperatorRole = (role?: string) => role === "ADMIN";

// ── Response shapes (mirror backend/src/routes/admin.ts) ──────────────────────

export interface Metrics {
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  dailyOrders: number;
  monthlyOrders: number;
  orderGrowth: number;
  totalUsers: number;
  newUsersToday: number;
  totalRevenuePaise: number;
  monthlyRevenuePaise: number;
  revenueGrowth: number;
  totalPagesPrinted: number;
  totalPrinters: number;
  activePrinters: number;
  offlinePrinters: number;
  lowPaperCount: number;
  pointsTopupPaise: number;
}

// The chart owns this shape, since it is shared by both consoles.
export type { RevenuePoint } from "@/components/console/RevenueChart";
import type { RevenuePoint } from "@/components/console/RevenueChart";

export interface TopPrinter {
  printerId: string | null;
  name: string;
  revenuePaise: number;
  orders: number;
}

export interface RevenueResponse {
  chartData: RevenuePoint[];
  topPrinters: TopPrinter[];
}

export interface OrderRow {
  id: string;
  orderCode: string;
  status: string;
  costPaise: number;
  pagesToPrint: number;
  colorMode: string;
  createdAt: string;
  user: { name: string; phone: string; email: string | null } | null;
  document: { fileName: string; pageCount: number } | null;
  printer: { name: string; shopName: string; uniquePrinterId: string } | null;
}

export interface UserRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: "STUDENT" | "OPERATOR" | "ADMIN";
  pointsBalancePaise: number;
  createdAt: string;
  _count: { orders: number };
}

export interface TransactionRow {
  id: string;
  type: string;
  amountPaise: number;
  description: string | null;
  createdAt: string;
  user: { name: string; phone: string } | null;
}

export interface KioskRow {
  id: string;
  name: string;
  shopName: string;
  locationName: string;
  uniquePrinterId: string;
  status: string;
  paperLevel: number;
  tonerLevel: number;
  lastSeenAt: string | null;
  ownerName: string;
  mobileNumber: string;
  /** Null for a printer that predates vendors and hasn't been assigned yet. */
  vendorId: string | null;
  locationId: string | null;
}

export interface SupportRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
}
