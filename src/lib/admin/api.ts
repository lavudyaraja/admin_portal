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
import type { RatingRow, RatingSummary } from "@/components/console/ratings";

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
  /** Total points ever credited by top-ups. */
  pointsToppedUp: number;
  /** Head count by role. `totalUsers` is students only, for historical reasons. */
  studentCount: number;
  vendorCount: number;
  adminCount: number;
  allUsersCount: number;
  vendorProfiles: number;
  bankAccounts: number;
  verifiedBankAccounts: number;
}

export interface BankAccountRow {
  id: string;
  accountHolder: string;
  accountLast4: string;
  accountMasked: string;
  ifsc: string;
  bankName: string | null;
  branch: string | null;
  upiId: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  ownerName: string;
  ownerContact: string;
  ownerRole: string;
  shopName: string | null;
}

export interface BankAccountsResponse {
  total: number;
  verified: number;
  unverified: number;
  accounts: BankAccountRow[];
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
  /** Prinsta Points, not paise. The legacy paise column is no longer written to. */
  pointsBalance: number;
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
  /** When the vendor registered this machine. */
  createdAt: string;
  brand: string;
  model: string;
  serialNumber: string | null;
  ipAddress: string;
  colorPrinting: boolean;
  duplexPrinting: boolean;
  supportedPaperSizes: string[];
  costPerBWPagePaise: number;
  costPerColorPagePaise: number;
  /** Usage from the mobile app: total orders, and distinct people who printed. */
  orders: number;
  customers: number;
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

// ── User profile bundle (GET /admin/users/:id) ───────────────────────────────

export interface UserRefund {
  id: string;
  amountPaise: number;
  pointsCredited: number;
  reason: string;
  origin: string;
  note: string | null;
  createdAt: string;
  order: { orderCode: string } | null;
}

export interface UserComplaint {
  id: string;
  code: string;
  category: string;
  subject: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface UserTicket {
  id: string;
  subject: string;
  status: string;
  reply: string | null;
  createdAt: string;
}

export interface UserPrinter {
  id: string;
  name: string;
  uniquePrinterId: string;
  shopName: string;
  locationName: string;
  orders: number;
  lastUsedAt: string;
}

export interface UserTxn {
  id: string;
  type: "CREDIT" | "DEBIT";
  amountPoints: number;
  balancePoints: number;
  amountPaise: number;
  balancePaise: number;
  description: string;
  orderId: string | null;
  createdAt: string;
}

export interface UserOrder {
  id: string;
  orderCode: string;
  status: string;
  costPaise: number;
  pagesToPrint: number;
  copies: number;
  colorMode: string;
  paymentMethod: string | null;
  createdAt: string;
  document: { fileName: string; fileType: string } | null;
  printer: { id: string; name: string; uniquePrinterId: string; shopName: string; locationName: string } | null;
}

/** Derived timeline, not an audit log — see the route's comment. */
export interface ActivityEvent {
  at: string;
  kind: "ORDER" | "CREDIT" | "DEBIT" | "REPORT" | "REFUND" | "JOINED";
  title: string;
  detail: string;
}

export interface UserProfile {
  user: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    rollNumber: string | null;
    role: string;
    pointsBalance: number;
    emailNotifications: boolean;
    createdAt: string;
    updatedAt: string;
    referralCode: string | null;
    referredById: string | null;
    referralRewardedAt: string | null;
    bannedAt: string | null;
    banReason: string | null;
    referredBy: { id: string; name: string; referralCode: string | null } | null;
    referrals: { id: string; name: string; createdAt: string; referralRewardedAt: string | null }[];
    _count: { orders: number; complaints: number; refunds: number; documents: number };
  };
  summary: {
    totalOrders: number;
    completedSpendPaise: number;
    pagesPrinted: number;
    pointsBalance: number;
    refunds: number;
    complaints: number;
    invited: number;
    invitedConverted: number;
    printersUsed: number;
  };
  orders: UserOrder[];
  transactions: UserTxn[];
  refunds: UserRefund[];
  complaints: UserComplaint[];
  tickets: UserTicket[];
  savedPrinters: UserPrinter[];
  activity: ActivityEvent[];
  /** How shops rate this customer. */
  ratingSummary: RatingSummary;
  /** What shops wrote about them, and what they wrote about shops — both sides,
   *  because a bad review a user left is often the context for the one they got. */
  ratingsReceived: RatingRow[];
  ratingsWritten: RatingRow[];
}

// ── Vendor profile bundle (GET /admin/vendors/:id) ───────────────────────────

export interface VendorPrinter {
  id: string;
  name: string;
  uniquePrinterId: string;
  brand: string;
  model: string;
  status: string;
  paperLevel: number;
  tonerLevel: number;
  locationName: string;
  costPerBWPagePaise: number;
  costPerColorPagePaise: number;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface VendorOrder {
  id: string;
  orderCode: string;
  status: string;
  costPaise: number;
  pagesToPrint: number;
  colorMode: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  printer: { name: string; uniquePrinterId: string } | null;
}

export interface VendorProfile {
  vendor: {
    id: string;
    shopName: string;
    contactName: string | null;
    mobileNumber: string | null;
    bannedAt: string | null;
    banReason: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      role: string;
      createdAt: string;
      bankAccount: {
        accountHolder: string;
        accountNumber: string;
        ifsc: string;
        bankName: string | null;
        branch: string | null;
        upiId: string | null;
        verified: boolean;
        updatedAt: string;
      } | null;
    } | null;
    locations: {
      id: string;
      name: string;
      address: string | null;
      createdAt: string;
      _count: { printers: number };
    }[];
    printers: VendorPrinter[];
  };
  summary: {
    totalOrders: number;
    completedOrders: number;
    failedOrders: number;
    cancelledOrders: number;
    revenuePaise: number;
    pagesPrinted: number;
    customers: number;
    printers: number;
    locations: number;
  };
  orders: VendorOrder[];
  activity: { at: string; kind: "ORDER" | "PRINTER" | "JOINED"; title: string; detail: string }[];
  /** Includes hidden ratings — staff see what was moderated, not just what shows. */
  ratingSummary: RatingSummary;
  ratings: RatingRow[];
}

export interface VendorListRow {
  id: string;
  shopName: string;
  contactName: string | null;
  mobileNumber: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string | null; phone: string | null } | null;
  locations: { id: string; name: string }[];
  _count: { printers: number; orders: number };
}
