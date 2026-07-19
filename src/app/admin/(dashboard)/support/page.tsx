"use client";

import { useState } from "react";
import { LuCircleHelp, LuChevronDown } from "react-icons/lu";
import { useList } from "@/lib/console/useList";
import { apiFetch, type SupportRow } from "@/lib/admin/api";
import { dateTime } from "@/lib/console/format";
import { ListToolbar, Pagination } from "@/components/console/ListToolbar";
import {
  Card, StatusChip, Skeleton, ErrorState, EmptyState, PageHeader, Pill, cx,
} from "@/components/console/primitives";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => ({
  value: s,
  label: s.replace(/_/g, " "),
}));

export default function SupportPage() {
  const list = useList<SupportRow>(apiFetch, "/admin/support", "tickets", "status");
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setSaving(id);
    try {
      await apiFetch(`/admin/support/${id}`, { method: "PATCH", body: { status } });
      list.reload();
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Support"
        subtitle="Tickets raised from the mobile app and the vendor console."
        action={<Pill n={list.total} />}
      />

      <ListToolbar
        filter={list.filter}
        setFilter={list.setFilter}
        filterLabel="statuses"
        options={STATUSES}
      />

      <Card>
        {list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : list.loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : list.rows.length === 0 ? (
          <EmptyState icon={LuCircleHelp} title="No tickets" hint="Nothing needs attention right now." />
        ) : (
          <>
            <ul className="divide-y divide-slate-50">
              {list.rows.map((t) => {
                const expanded = open === t.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setOpen(expanded ? null : t.id)}
                      className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
                      aria-expanded={expanded}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{t.subject}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {t.name} · {t.email} · {dateTime(t.createdAt)}
                        </p>
                      </div>
                      <StatusChip status={t.status} />
                      <LuChevronDown
                        size={15}
                        className={cx(
                          "text-slate-400 shrink-0 mt-0.5 transition-transform",
                          expanded && "rotate-180"
                        )}
                      />
                    </button>

                    {expanded && (
                      <div className="px-5 pb-4 -mt-1">
                        <div className="bg-tint-gray rounded-xl p-3.5 border border-slate-200/60">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.message}</p>
                          {t.reply && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Reply
                              </p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{t.reply}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {STATUSES.filter((s) => s.value !== t.status).map((s) => (
                            <button
                              key={s.value}
                              onClick={() => setStatus(t.id, s.value)}
                              disabled={saving === t.id}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              Mark {s.label.toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pagination page={list.page} setPage={list.setPage} total={list.total} />
          </>
        )}
      </Card>
    </>
  );
}
