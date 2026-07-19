"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuIndianRupee,
  LuFileText,
  LuUsers,
  LuPrinter,
  LuFileStack,
  LuCircleCheck,
  LuTriangleAlert,
  LuCircleOff,
  LuArrowRight,
  LuInbox,
  LuPlus,
  LuQrCode,
  LuTrendingUp,
} from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr, inrCompact, count, dateTime } from "@/lib/console/format";
import {
  Card,
  CardHeader,
  StatTile,
  StatusChip,
  Table,
  Td,
  Tr,
  Skeleton,
  ErrorState,
  EmptyState,
  PageHeader,
} from "@/components/console/primitives";
import RevenueChart, { type RevenuePoint } from "@/components/console/RevenueChart";

interface Metrics {
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
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
}

interface TopPrinter {
  printerId: string | null;
  name: string;
  revenuePaise: number;
  orders: number;
}

interface RevenueData {
  chartData: RevenuePoint[];
  topPrinters: TopPrinter[];
}

interface Order {
  id: string;
  orderCode: string;
  status: string;
  costPaise: number;
  pagesToPrint: number;
  colorMode: string;
  createdAt: string;
  user: { name: string; phone: string | null } | null;
  printer: { name: string; shopName: string } | null;
  document: { fileName: string } | null;
}

type Period = "7d" | "30d" | "90d";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [m, r, o] = await Promise.all([
        apiFetch<Metrics>("/admin/metrics"),
        apiFetch<RevenueData>(`/admin/revenue?period=${period}`),
        apiFetch<{ orders: Order[] }>("/admin/orders?limit=6"),
      ]);
      setMetrics(m);
      setRevenue(r);
      setOrders(o.orders || []);
    } catch (err) {
      // Surfaced rather than swallowed: the previous version caught and ignored,
      // so a failed load was indistinguishable from a brand-new empty account.
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Card>
        <ErrorState message={error} onRetry={load} />
      </Card>
    );
  }

  const successRate =
    metrics && metrics.totalOrders > 0
      ? Math.round((metrics.completedOrders / metrics.totalOrders) * 100)
      : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of your printers, orders and earnings."
        action={
          <Link
            href="/vendor/printers/add"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            <LuPlus size={14} /> Register printer
          </Link>
        }
      />

      {/* ── Headline stats ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {loading || !metrics ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatTile
              label="Total revenue"
              value={inrCompact(metrics.totalRevenuePaise)}
              icon={LuIndianRupee}
              tint="mint"
              hint={`${inrCompact(metrics.monthlyRevenuePaise)} this month`}
            />
            <StatTile
              label="This month"
              value={inrCompact(metrics.monthlyRevenuePaise)}
              icon={LuIndianRupee}
              tint="sky"
              delta={metrics.revenueGrowth}
            />
            <StatTile
              label="Total orders"
              value={count(metrics.totalOrders)}
              icon={LuFileText}
              tint="lavender"
              delta={metrics.orderGrowth}
            />
            <StatTile
              label="Orders today"
              value={count(metrics.dailyOrders)}
              icon={LuFileText}
              tint="ice"
              hint={`${count(metrics.monthlyOrders)} this month`}
            />
            <StatTile
              label="Customers"
              value={count(metrics.totalUsers)}
              icon={LuUsers}
              tint="violet"
              hint={`+${count(metrics.newUsersToday)} today`}
            />
            <StatTile
              label="Pages printed"
              value={count(metrics.totalPagesPrinted)}
              icon={LuFileStack}
              tint="cream"
            />
            <StatTile
              label="Printers online"
              value={`${metrics.activePrinters}/${metrics.totalPrinters}`}
              icon={LuPrinter}
              tint="aqua"
              hint={`${metrics.offlinePrinters} offline`}
            />
            <StatTile
              label="Success rate"
              value={`${successRate}%`}
              icon={LuCircleCheck}
              tint="gold"
              hint={`${count(metrics.completedOrders)} completed`}
            />
          </>
        )}
      </section>

      {/* ── Attention strip — only rendered when something actually needs it ── */}
      {metrics &&
        (metrics.lowPaperCount > 0 ||
          metrics.offlinePrinters > 0 ||
          metrics.failedOrders > 0) && (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {metrics.offlinePrinters > 0 && (
              <AlertCard
                tint="bg-tint-gray"
                icon={<LuCircleOff size={16} className="text-slate-500" />}
                title={`${metrics.offlinePrinters} printer${metrics.offlinePrinters > 1 ? "s" : ""} offline`}
                hint="These can't take new orders."
                href="/vendor/printers"
              />
            )}
            {metrics.lowPaperCount > 0 && (
              <AlertCard
                tint="bg-tint-gold"
                icon={<LuTriangleAlert size={16} className="text-ink-gold" />}
                title={`${metrics.lowPaperCount} printer${metrics.lowPaperCount > 1 ? "s" : ""} low on paper`}
                hint="At or below 20% remaining."
                href="/vendor/printers"
              />
            )}
            {metrics.failedOrders > 0 && (
              <AlertCard
                tint="bg-tint-blush"
                icon={<LuTriangleAlert size={16} className="text-ink-blush" />}
                title={`${count(metrics.failedOrders)} failed order${metrics.failedOrders > 1 ? "s" : ""}`}
                hint="May need a refund or a reprint."
                href="/vendor/orders?status=FAILED"
              />
            )}
          </section>
        )}

      {/* ── Revenue trend ── */}
      <Card className="mb-4">
        <CardHeader
          title="Revenue"
          subtitle={`Completed orders, last ${period === "7d" ? "7" : period === "90d" ? "90" : "30"} days`}
          action={
            <div className="flex bg-slate-100 rounded-xl p-0.5 gap-0.5">
              {(["7d", "30d", "90d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    period === p
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-4">
          {loading || !revenue ? (
            <Skeleton className="h-[220px] rounded-xl" />
          ) : (
            <RevenueChart data={revenue.chartData} />
          )}
        </div>
      </Card>

      {/* ── Recent orders + top printers ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent orders"
            subtitle="Newest first"
            action={
              <Link
                href="/vendor/orders"
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                All orders <LuArrowRight size={12} />
              </Link>
            }
          />
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={LuInbox}
              title="No orders yet"
              hint="Orders appear here as soon as someone prints."
            />
          ) : (
            <Table head={["Document", "Customer", "Pages", "Status", "Amount"]}>
              {orders.map((o) => (
                <Tr key={o.id}>
                  <Td className="min-w-[160px]">
                    <p className="font-semibold text-slate-700 truncate max-w-[200px]">
                      {o.document?.fileName || o.orderCode}
                    </p>
                    <p className="text-[11px] text-slate-400">{dateTime(o.createdAt)}</p>
                  </Td>
                  <Td>
                    <p className="truncate max-w-[140px]">{o.user?.name || "—"}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {o.printer?.shopName || "Unassigned"}
                    </p>
                  </Td>
                  <Td className="tabular-nums whitespace-nowrap">
                    {o.pagesToPrint}pg · {o.colorMode === "COLOR" ? "Colour" : "B&W"}
                  </Td>
                  <Td>
                    <StatusChip status={o.status} />
                  </Td>
                  <Td className="font-bold text-slate-800 tabular-nums whitespace-nowrap">
                    {inr(o.costPaise)}
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Top earning printers"
            subtitle="By revenue in the selected period"
            action={
              <Link
                href="/vendor/printers"
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                All <LuArrowRight size={12} />
              </Link>
            }
          />
          {loading || !revenue ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : revenue.topPrinters.length === 0 ? (
            <EmptyState
              icon={LuInbox}
              title="No revenue yet"
              hint="Top printers appear once orders complete."
            />
          ) : (
            <TopPrinterList rows={revenue.topPrinters} />
          )}
        </Card>
      </section>

      {/* ── Quick actions ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickAction
          href="/vendor/printers/add"
          tint="bg-tint-lavender"
          icon={<LuPlus size={17} className="text-ink-lavender" />}
          title="Register printer"
          hint="Add a new Wi-Fi printer to your shop."
        />
        <QuickAction
          href="/vendor/qr"
          tint="bg-tint-sky"
          icon={<LuQrCode size={17} className="text-ink-sky" />}
          title="Print QR codes"
          hint="Download the poster to stick on a machine."
        />
        <QuickAction
          href="/vendor/revenue"
          tint="bg-tint-mint"
          icon={<LuTrendingUp size={17} className="text-ink-mint" />}
          title="Revenue analytics"
          hint="Trends, payouts and top locations."
        />
      </section>
    </>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function AlertCard({
  tint,
  icon,
  title,
  hint,
  href,
}: {
  tint: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${tint} border border-slate-200/60 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-slate-300 transition-colors group`}
    >
      <span className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 truncate">{title}</p>
        <p className="text-[11px] text-slate-500 truncate">{hint}</p>
      </div>
      <LuArrowRight
        size={14}
        className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0"
      />
    </Link>
  );
}

/** Ranked bars — magnitude against one axis, so one hue at varying width. */
function TopPrinterList({ rows }: { rows: TopPrinter[] }) {
  const max = Math.max(1, ...rows.map((r) => r.revenuePaise));
  return (
    <Table head={["#", "Printer", "Revenue"]}>
      {rows.map((r, i) => (
        <Tr key={r.printerId || i}>
          <Td className="w-8 text-slate-400 font-bold tabular-nums">{i + 1}</Td>
          <Td className="min-w-[140px]">
            <p className="font-semibold text-slate-700 truncate max-w-[160px]">{r.name}</p>
            <div className="h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden max-w-[160px]">
              <div
                className="h-full rounded-full bg-ink-sky"
                style={{ width: `${Math.max(3, (r.revenuePaise / max) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{count(r.orders)} orders</p>
          </Td>
          <Td className="font-bold text-slate-800 tabular-nums whitespace-nowrap">
            {inr(r.revenuePaise)}
          </Td>
        </Tr>
      ))}
    </Table>
  );
}

function QuickAction({
  href,
  tint,
  icon,
  title,
  hint,
}: {
  href: string;
  tint: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-slate-200 rounded-2xl px-4 py-4 hover:border-slate-300 transition-colors group"
    >
      <span className={`w-9 h-9 rounded-xl ${tint} flex items-center justify-center mb-3`}>
        {icon}
      </span>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{hint}</p>
    </Link>
  );
}
