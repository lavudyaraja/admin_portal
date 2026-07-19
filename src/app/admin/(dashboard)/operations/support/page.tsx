"use client";

// Support: tickets raised with the platform, and replying to them.
//
// A ticket's audience — user query vs vendor query — comes from the author's
// role, since the ticket row itself only stores a name and an email. Live Chat
// and Escalations have nothing behind them and say so.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  LuLifeBuoy, LuInbox, LuUser, LuStore, LuMessageCircle,
  LuTrendingUp, LuCircleCheck, LuRefreshCw, LuSend,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { count, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, StatusChip, Chip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  authorRole: string | null;
  audience: "USER" | "VENDOR" | "STAFF" | "UNKNOWN";
}

interface SupportData {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  tickets: Ticket[];
}

function SupportOpsPageBody() {
  const tab = useOpsTab("tickets");
  const [data, setData] = useState<SupportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<SupportData>("/operations/support"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(status: "IN_PROGRESS" | "RESOLVED" | "CLOSED") {
    if (!active) return;
    setSaving(true);
    try {
      await apiFetch(`/operations/support/${active.id}`, { method: "PATCH", body: { status, reply } });
      setActive(null);
      setReply("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update that ticket.");
    }
    setSaving(false);
  }

  const rows = useMemo(() => {
    const all = data?.tickets || [];
    switch (tab) {
      case "users": return all.filter((t) => t.audience === "USER");
      case "vendors": return all.filter((t) => t.audience === "VENDOR");
      case "resolved": return all.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
      default: return all;
    }
  }, [data, tab]);

  const tabs: OpsTab[] = [
    { id: "tickets", label: "All Tickets", icon: LuInbox, count: data?.total },
    { id: "users", label: "User Queries", icon: LuUser, count: data?.tickets.filter((t) => t.audience === "USER").length },
    { id: "vendors", label: "Vendor Queries", icon: LuStore, count: data?.tickets.filter((t) => t.audience === "VENDOR").length },
    { id: "chat", label: "Live Chat", icon: LuMessageCircle },
    { id: "escalations", label: "Escalations", icon: LuTrendingUp },
    { id: "resolved", label: "Resolved", icon: LuCircleCheck, count: data ? data.resolved + data.closed : undefined },
  ];

  return (
    <>
      <PageHeader
        title="Support"
        subtitle="Tickets raised with the platform, from users and shop owners."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Open" value={count(data.open)} icon={LuInbox} tint={data.open > 0 ? "gold" : "gray"} hint={`${count(data.inProgress)} in progress`} />
            <StatTile label="Resolved" value={count(data.resolved)} icon={LuCircleCheck} tint="mint" hint={`${count(data.closed)} closed`} />
            <StatTile label="From users" value={count(data.tickets.filter((t) => t.audience === "USER").length)} icon={LuUser} tint="sky" hint="student accounts" />
            <StatTile label="From vendors" value={count(data.tickets.filter((t) => t.audience === "VENDOR").length)} icon={LuStore} tint="lavender" hint="shop owners" />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/operations/support" />

      {tab === "chat" ? (
        <NoRecord
          icon={LuMessageCircle}
          title="Live chat doesn't exist"
          needs="There is no chat channel, message store or presence tracking anywhere in the platform. Support is asynchronous tickets only. This needs a realtime transport and a message model before there is a conversation to join."
        />
      ) : tab === "escalations" ? (
        <NoRecord
          icon={LuTrendingUp}
          title="Escalation isn't modelled"
          needs="A ticket has a status but no priority, severity, owner or SLA, so nothing can be escalated to anyone. This needs a priority and assignment on the ticket before a queue here means anything."
        />
      ) : loading ? (
        <Card><div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={load} /></Card>
      ) : (
        <Card>
          {rows.length === 0 ? (
            <EmptyState
              icon={LuLifeBuoy}
              title="No tickets here"
              hint="Requests raised from the app or the vendor console appear here."
            />
          ) : (
            <Table head={["From", "Subject", "Audience", "Status", "Reply", "When", "Action"]}>
              {rows.map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <p className="font-semibold text-slate-700">{t.name}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{t.email}</p>
                  </Td>
                  <Td className="text-slate-600 truncate max-w-[200px]">{t.subject}</Td>
                  <Td>
                    <Chip
                      label={t.audience === "UNKNOWN" ? "Guest" : t.audience.toLowerCase()}
                      tint={t.audience === "VENDOR" ? "lavender" : t.audience === "USER" ? "sky" : "gray"}
                    />
                  </Td>
                  <Td><StatusChip status={t.status} /></Td>
                  <Td className="text-xs text-slate-500 truncate max-w-[180px]">
                    {t.reply || <span className="text-slate-400 italic">No reply yet</span>}
                  </Td>
                  <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(t.createdAt)}</Td>
                  <Td>
                    <button
                      onClick={() => { setActive(t); setReply(t.reply || ""); }}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-2 py-1 transition-colors cursor-pointer"
                    >
                      Reply
                    </button>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900">{active.subject}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{active.name} · {active.email}</p>
              </div>
              <StatusChip status={active.status} />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 mb-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{active.message}</p>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Your reply
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              placeholder="Answer their question."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors resize-y"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Sending notifies the author in the app, when the ticket has a signed-in author.
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={() => save("RESOLVED")}
                disabled={saving || !reply.trim()}
                className="flex-1 min-w-32 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
              >
                <LuSend size={14} /> Reply &amp; resolve
              </button>
              <button
                onClick={() => save("IN_PROGRESS")}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                In progress
              </button>
              <button
                onClick={() => save("CLOSED")}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The tab lives in the URL, so this reads `useSearchParams`. Next needs that
 * behind a Suspense boundary or the route can't be prerendered — without it the
 * production build fails outright.
 */
export default function SupportOpsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <SupportOpsPageBody />
    </Suspense>
  );
}
