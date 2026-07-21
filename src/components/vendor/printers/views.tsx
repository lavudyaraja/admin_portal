"use client";

/**
 * The five fleet views, as components rather than routes.
 *
 * They were separate pages; they are tabs now, so each is a component that
 * brings its own `useFleet()` call. They deliberately do *not* share one hook
 * instance hoisted into the parent — only one view is mounted at a time, and a
 * shared fetch would keep five views' worth of derived state alive to serve one.
 *
 * `FleetPage` still provides the frame (refresh, loading, error, empty), minus
 * the page header, which the tab host owns.
 */
import Link from "next/link";
import {
  LuActivity, LuHeartPulse, LuLayers, LuDroplet, LuWrench, LuCircleCheck,
} from "react-icons/lu";
import { Card, Table, Td, Tr, EmptyState, Chip, cx } from "@/components/console/primitives";
import {
  FleetPage, LastSeen, PrinterCell, StatusDot, CountChip, LevelMeter,
  useFleet, attentionReasons, isStale, LOW_PAPER, LOW_TONER,
} from "./fleet";

// ── Status ──────────────────────────────────────────────────────────────────

export function StatusView() {
  const state = useFleet();
  const { printers } = state;

  const online = printers.filter((p) => p.status === "ONLINE").length;
  const busy = printers.filter((p) => p.status === "BUSY").length;
  const offline = printers.filter((p) => p.status === "OFFLINE").length;
  const errored = printers.filter((p) => p.status === "ERROR" || p.status === "OUT_OF_PAPER").length;
  const stale = printers.filter(isStale).length;

  return (
    <FleetPage
      icon={LuActivity}
      emptyTitle="No printers yet"
      emptyHint="Register a printer and its live status appears here."
      state={state}
      summary={
        <div className="flex flex-wrap gap-2">
          <CountChip label="online" n={online} tone="good" />
          <CountChip label="busy" n={busy} />
          <CountChip label="offline" n={offline} />
          {errored > 0 && <CountChip label="in error" n={errored} tone="bad" />}
          {stale > 0 && <CountChip label="out of contact" n={stale} tone="warn" />}
        </div>
      }
    >
      <Card>
        <Table head={["Printer", "Status", "Model", "Capabilities", "Orders", "Last seen"]}>
          {printers.map((p) => (
            <Tr key={p.id}>
              <Td>
                <PrinterCell printer={p} />
              </Td>
              <Td>
                <StatusDot status={p.status} />
              </Td>
              <Td className="text-xs text-slate-500 truncate max-w-[140px]">
                {[p.brand, p.model].filter(Boolean).join(" ") || "—"}
              </Td>
              <Td className="text-[11px] text-slate-500 whitespace-nowrap">
                {p.colorPrinting ? "Colour" : "B&W only"}
                {p.duplexPrinting ? " · Duplex" : ""}
              </Td>
              <Td className="tabular-nums text-sm text-slate-600">{p.orders ?? 0}</Td>
              <Td>
                <LastSeen at={p.lastSeenAt} />
              </Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </FleetPage>
  );
}

// ── Health ──────────────────────────────────────────────────────────────────

/** Failure rate → a word, so the column reads without doing the maths. */
function healthLabel(rate: number, orders: number) {
  if (orders < 5) return { label: "Too few jobs", cls: "text-slate-400" };
  if (rate >= 0.2) return { label: "Poor", cls: "text-rose-600" };
  if (rate >= 0.08) return { label: "Shaky", cls: "text-amber-600" };
  return { label: "Good", cls: "text-emerald-600" };
}

export function HealthView() {
  const state = useFleet();
  const { printers } = state;

  const needsAttention = printers.filter((p) => attentionReasons(p).length > 0).length;
  const healthy = printers.length - needsAttention;

  return (
    <FleetPage
      icon={LuHeartPulse}
      emptyTitle="No printers yet"
      emptyHint="Health appears once a printer has run some jobs."
      state={state}
      summary={
        <div className="flex flex-wrap gap-2">
          <CountChip label="healthy" n={healthy} tone="good" />
          {needsAttention > 0 && <CountChip label="need attention" n={needsAttention} tone="warn" />}
        </div>
      }
    >
      <Card>
        <Table
          head={["Printer", "Status", "Jobs", "Failed", "Reliability", "Paper", "Toner", "Last seen"]}
        >
          {printers.map((p) => {
            const orders = p.orders ?? 0;
            const failures = p.failures ?? 0;
            const rate = orders > 0 ? failures / orders : 0;
            const health = healthLabel(rate, orders);

            return (
              <Tr key={p.id}>
                <Td>
                  <PrinterCell printer={p} />
                </Td>
                <Td>
                  <StatusDot status={p.status} />
                </Td>
                <Td className="tabular-nums text-sm text-slate-600">{orders}</Td>
                <Td
                  className={cx(
                    "tabular-nums text-sm font-semibold",
                    failures > 0 ? "text-rose-600" : "text-slate-400"
                  )}
                >
                  {failures}
                </Td>
                <Td>
                  <span className={cx("text-xs font-bold", health.cls)}>{health.label}</span>
                  {orders >= 5 && (
                    <span className="block text-[10px] text-slate-400 tabular-nums">
                      {Math.round((1 - rate) * 100)}% success
                    </span>
                  )}
                </Td>
                <Td>
                  <LevelMeter value={p.paperLevel} low={LOW_PAPER} />
                </Td>
                <Td>
                  <LevelMeter value={p.tonerLevel} low={LOW_TONER} />
                </Td>
                <Td>
                  <LastSeen at={p.lastSeenAt} />
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Card>
    </FleetPage>
  );
}

// ── Paper ───────────────────────────────────────────────────────────────────

export function PaperView() {
  const state = useFleet();
  // Sorted rather than filtered: someone refilling trays wants the whole round
  // in the order they should walk it, not just what crossed a threshold.
  const printers = [...state.printers].sort((a, b) => a.paperLevel - b.paperLevel);

  const low = printers.filter((p) => p.paperLevel <= LOW_PAPER).length;
  const empty = printers.filter((p) => p.status === "OUT_OF_PAPER" || p.paperLevel <= 5).length;

  return (
    <FleetPage
      icon={LuLayers}
      emptyTitle="No printers yet"
      emptyHint="Paper levels appear once a printer reports in."
      state={state}
      summary={
        <div className="flex flex-wrap gap-2">
          {empty > 0 && <CountChip label="out of paper" n={empty} tone="bad" />}
          {low > 0 && <CountChip label={`at or below ${LOW_PAPER}%`} n={low} tone="warn" />}
          <CountChip label="printers" n={printers.length} />
        </div>
      }
    >
      <Card>
        <Table head={["Printer", "Paper level", "Status", "Location", "Jobs run"]}>
          {printers.map((p) => (
            <Tr key={p.id}>
              <Td>
                <PrinterCell printer={p} />
              </Td>
              <Td>
                <LevelMeter value={p.paperLevel} low={LOW_PAPER} />
              </Td>
              <Td>
                <StatusDot status={p.status} />
              </Td>
              <Td className="text-xs text-slate-500 truncate max-w-[160px]">
                {p.locationName || p.shopName || "—"}
              </Td>
              <Td className="tabular-nums text-sm text-slate-600">{p.orders ?? 0}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </FleetPage>
  );
}

// ── Ink ─────────────────────────────────────────────────────────────────────

export function InkView() {
  const state = useFleet();
  const printers = [...state.printers].sort((a, b) => a.tonerLevel - b.tonerLevel);

  const low = printers.filter((p) => p.tonerLevel <= LOW_TONER).length;
  const critical = printers.filter((p) => p.tonerLevel <= 5).length;

  return (
    <FleetPage
      icon={LuDroplet}
      emptyTitle="No printers yet"
      emptyHint="Ink levels appear once a printer reports in."
      state={state}
      summary={
        <div className="flex flex-wrap gap-2">
          {critical > 0 && <CountChip label="nearly dry" n={critical} tone="bad" />}
          {low > 0 && <CountChip label={`at or below ${LOW_TONER}%`} n={low} tone="warn" />}
          <CountChip label="printers" n={printers.length} />
        </div>
      }
    >
      <Card>
        <Table head={["Printer", "Toner level", "Type", "Status", "Location", "Jobs run"]}>
          {printers.map((p) => (
            <Tr key={p.id}>
              <Td>
                <PrinterCell printer={p} />
              </Td>
              <Td>
                <LevelMeter value={p.tonerLevel} low={LOW_TONER} />
              </Td>
              <Td>
                <Chip
                  label={p.colorPrinting ? "Colour" : "Black only"}
                  tint={p.colorPrinting ? "lavender" : "gray"}
                />
              </Td>
              <Td>
                <StatusDot status={p.status} />
              </Td>
              <Td className="text-xs text-slate-500 truncate max-w-[150px]">
                {p.locationName || p.shopName || "—"}
              </Td>
              <Td className="tabular-nums text-sm text-slate-600">{p.orders ?? 0}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </FleetPage>
  );
}

// ── Maintenance ─────────────────────────────────────────────────────────────

/**
 * Every machine that wants a human, and why.
 *
 * There is no maintenance *log* behind this — nothing records a service visit,
 * so this doesn't pretend to. It derives the work list from live signals the
 * machines actually report, including a failure rate that says a printer is
 * broken while it insists it is fine.
 */
export function MaintenanceView() {
  const state = useFleet();

  // Most reasons first — a machine flagged three ways is the one to walk to.
  const flagged = state.printers
    .map((p) => ({ printer: p, reasons: attentionReasons(p) }))
    .filter((r) => r.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const clear = state.printers.length - flagged.length;

  return (
    <FleetPage
      icon={LuWrench}
      emptyTitle="No printers yet"
      emptyHint="Register a printer and anything needing attention shows up here."
      state={state}
      summary={
        <div className="flex flex-wrap gap-2">
          {flagged.length > 0 && (
            <CountChip label="need attention" n={flagged.length} tone="bad" />
          )}
          <CountChip label="running clean" n={clear} tone="good" />
        </div>
      }
    >
      {flagged.length === 0 ? (
        <Card>
          <EmptyState
            icon={LuCircleCheck}
            title="Everything looks healthy"
            hint="No printer is reporting an error, running low, or failing jobs."
          />
        </Card>
      ) : (
        <Card>
          <Table head={["Printer", "Status", "Needs attention", "Last seen"]}>
            {flagged.map(({ printer, reasons }) => (
              <Tr key={printer.id}>
                <Td>
                  <Link href={`/vendor/printers/${printer.id}`} className="hover:underline">
                    <PrinterCell printer={printer} />
                  </Link>
                </Td>
                <Td>
                  <StatusDot status={printer.status} />
                </Td>
                <Td>
                  <ul className="space-y-1">
                    {reasons.map((r) => (
                      <li key={r} className="flex items-center gap-2">
                        <span
                          className={cx(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            r.includes("error") || r.includes("failing") || r.includes("Out of")
                              ? "bg-rose-500"
                              : "bg-amber-400"
                          )}
                        />
                        <span className="text-xs text-slate-600">{r}</span>
                      </li>
                    ))}
                  </ul>
                </Td>
                <Td>
                  <LastSeen at={printer.lastSeenAt} />
                </Td>
              </Tr>
            ))}
          </Table>
          <p className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400">
            This list is derived from what the machines report — there is no service history behind
            it. Recording a completed repair needs a maintenance log, which doesn&apos;t exist yet.
          </p>
        </Card>
      )}
    </FleetPage>
  );
}
