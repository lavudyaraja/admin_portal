"use client";

// Notifications.
//
// In-app is the only channel that actually delivers. Email exists but only as
// transactional mail the backend sends itself (order, login) — it can't be
// broadcast from here. Push and SMS have no transport at all: no device tokens
// are stored, no gateway is configured.
//
// The broadcast composer is real — it writes Notification rows that the mobile
// app's bell reads — so it reports exactly how many people it reached.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuBell, LuMail, LuSmartphone, LuMessageSquare, LuFileText,
  LuChartBar, LuSend, LuRefreshCw, LuCircleCheck, LuTriangleAlert,
} from "react-icons/lu";
import { apiFetch } from "@/lib/admin/api";
import { count, dateTime } from "@/lib/console/format";
import { OpsTabs, useOpsTab, NoRecord, type OpsTab } from "@/components/admin/OpsTabs";
import { StatRow } from "@/components/admin/StatRow";
import {
  Card, Table, Td, Tr, Chip, Skeleton, ErrorState, EmptyState, PageHeader, StatTile,
} from "@/components/console/primitives";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  read: boolean;
  orderId: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string } | null;
}

interface Channel { available: boolean; note: string }

interface NotificationData {
  total: number;
  unread: number;
  read: number;
  last30Days: number;
  reachedUsers: number;
  recent: NotificationRow[];
  channels: { inApp: Channel; email: Channel; push: Channel; sms: Channel };
}

const AUDIENCES = [
  { value: "ALL", label: "Everyone" },
  { value: "STUDENT", label: "Students only" },
  { value: "VENDOR", label: "Vendors only" },
  { value: "ADMIN", label: "Operators only" },
];

function NotificationsPageBody() {
  const tab = useOpsTab("inapp");
  const [data, setData] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("ALL");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch<NotificationData>("/system/notifications"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function broadcast() {
    setSending(true);
    setSent(null);
    try {
      const res = await apiFetch<{ sent: number; recipients: number }>("/system/notifications/broadcast", {
        method: "POST",
        body: { title, body, audience },
      });
      setSent(`Delivered to ${res.sent} ${res.sent === 1 ? "person" : "people"}.`);
      setTitle("");
      setBody("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not send that notification.");
    }
    setSending(false);
  }

  const tabs: OpsTab[] = [
    { id: "inapp", label: "In-App", icon: LuBell, count: data?.total },
    { id: "email", label: "Email", icon: LuMail },
    { id: "push", label: "Push", icon: LuSmartphone },
    { id: "sms", label: "SMS", icon: LuMessageSquare },
    { id: "templates", label: "Templates", icon: LuFileText },
    { id: "delivery", label: "Delivery Reports", icon: LuChartBar },
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="What the platform can send, and what it has sent."
        action={
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer">
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <StatRow loading={!data}>
        {data && (
          <>
            <StatTile label="Sent" value={count(data.total)} icon={LuBell} tint="lavender" hint={`${count(data.last30Days)} in 30 days`} />
            <StatTile label="Unread" value={count(data.unread)} icon={LuTriangleAlert} tint={data.unread > 0 ? "gold" : "gray"} hint="not yet opened" />
            <StatTile label="Read" value={count(data.read)} icon={LuCircleCheck} tint="mint" hint="opened in the app" />
            <StatTile label="People reached" value={count(data.reachedUsers)} icon={LuSmartphone} tint="sky" hint="distinct recipients" />
          </>
        )}
      </StatRow>

      <OpsTabs tabs={tabs} active={tab} basePath="/admin/system/notifications" />

      {tab === "push" ? (
        <NoRecord
          icon={LuSmartphone}
          title="Push notifications aren't wired up"
          needs="No device token is stored anywhere and no push service (FCM, APNs or Expo) is configured. The app can't be reached outside a session. This needs token registration on the device and a push provider before anything can be delivered."
        />
      ) : tab === "sms" ? (
        <NoRecord
          icon={LuMessageSquare}
          title="No SMS gateway"
          needs="Nothing in the platform sends SMS — there is no provider configured and no delivery path. Phone numbers are collected for sign-in only. This needs an SMS provider before this channel exists."
        />
      ) : tab === "templates" ? (
        <NoRecord
          icon={LuFileText}
          title="Templates aren't stored"
          needs="The wording of every message is hardcoded — order mails in the mailer, in-app text at the point it's created. There is no template record to edit, version or preview. This needs templates as data before they can be managed here."
        />
      ) : tab === "delivery" ? (
        <NoRecord
          icon={LuChartBar}
          title="Delivery isn't tracked"
          needs="An in-app notification records whether it was read, but nothing records whether an email was delivered, bounced or opened — the mailer sends and forgets. This needs delivery webhooks from the mail provider before a report is possible."
        />
      ) : tab === "email" ? (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-tint-mint flex items-center justify-center shrink-0">
              <LuMail size={18} className="text-ink-mint" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Transactional email is live</h3>
              <p className="text-sm text-slate-500 mt-1">
                The backend sends order confirmations and new-login alerts through the mailer. Users
                can turn these off individually — that&apos;s the <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">emailNotifications</code> flag
                on their account.
              </p>
              <p className="text-sm text-slate-500 mt-3">
                It isn&apos;t a broadcast channel: there is no campaign, list or send-to-segment path
                for email. To reach people from here, use the in-app composer.
              </p>
              <Link href="/admin/system/notifications?tab=inapp" className="inline-block mt-3 text-xs font-bold text-slate-700 hover:underline">
                Go to the in-app composer →
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Composer — this genuinely sends. */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-xl bg-tint-lavender flex items-center justify-center">
                <LuSend size={16} className="text-ink-lavender" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Send an in-app notification</h3>
                <p className="text-[11px] text-slate-400">
                  Appears in the recipient&apos;s bell immediately. Banned accounts are skipped.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title — e.g. Printers offline at CSE Center"
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="The message people will read."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors resize-y"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-slate-400 cursor-pointer"
                >
                  {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <button
                  onClick={broadcast}
                  disabled={sending || title.trim().length < 3 || body.trim().length < 3}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <LuSend size={14} /> {sending ? "Sending…" : "Send"}
                </button>
                {sent && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <LuCircleCheck size={13} /> {sent}
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card>
            {error ? (
              <ErrorState message={error} onRetry={load} />
            ) : loading || !data ? (
              <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : data.recent.length === 0 ? (
              <EmptyState icon={LuBell} title="Nothing sent yet" hint="Notifications you send appear here." />
            ) : (
              <Table head={["Recipient", "Title", "Message", "Status", "When"]}>
                {data.recent.map((n) => (
                  <Tr key={n.id}>
                    <Td>
                      {n.user ? (
                        <Link href={`/admin/management/users/${n.user.id}`} className="text-slate-700 hover:underline text-sm">
                          {n.user.name}
                        </Link>
                      ) : "—"}
                      <p className="text-[11px] text-slate-400">{n.user?.role.toLowerCase()}</p>
                    </Td>
                    <Td className="font-semibold text-slate-700 truncate max-w-[180px]">{n.title}</Td>
                    <Td className="text-xs text-slate-500 truncate max-w-[240px]">{n.body}</Td>
                    <Td><Chip label={n.read ? "Read" : "Unread"} tint={n.read ? "mint" : "gold"} /></Td>
                    <Td className="text-slate-400 text-xs whitespace-nowrap">{dateTime(n.createdAt)}</Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />}>
      <NotificationsPageBody />
    </Suspense>
  );
}
