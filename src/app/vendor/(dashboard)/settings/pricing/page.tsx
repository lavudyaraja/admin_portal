"use client";

// Pricing rules — what each machine charges per page.
//
// Price lives on the printer, not on the shop, and that is deliberate: an order
// is priced from the machine it is sent to, so a shop can charge differently at
// a busy branch than at a quiet one. There is no shop-wide rate to set, which is
// why this page is a list of machines rather than a form.
//
// Prices are entered in rupees and stored in paise. The conversion happens once,
// here, on save — carrying rupees any further would put floats through the
// billing path.
import { useCallback, useEffect, useState } from "react";
import { LuPercent, LuSave, LuRefreshCw, LuPrinter, LuTriangleAlert } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { inr } from "@/lib/console/format";
import {
  Card, CardHeader, Skeleton, ErrorState, EmptyState, PageHeader, cx,
} from "@/components/console/primitives";

interface Printer {
  id: string;
  name: string;
  uniquePrinterId: string;
  locationName: string;
  status: string;
  colorPrinting: boolean;
  costPerBWPagePaise: number;
  costPerColorPagePaise: number;
}

/** Paise → a rupee string for the input. */
const toRupees = (paise: number) => (paise / 100).toFixed(2);

export default function PricingRulesPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { bw: string; color: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ printers: Printer[] }>("/printers?limit=200");
      const list = res.printers || [];
      setPrinters(list);
      setDrafts(
        Object.fromEntries(
          list.map((p) => [
            p.id,
            { bw: toRupees(p.costPerBWPagePaise), color: toRupees(p.costPerColorPagePaise) },
          ])
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your printers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function edit(id: string, field: "bw" | "color", value: string) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
    setSavedId(null);
    setRowError((e) => ({ ...e, [id]: "" }));
  }

  function isDirty(p: Printer): boolean {
    const d = drafts[p.id];
    if (!d) return false;
    return (
      d.bw !== toRupees(p.costPerBWPagePaise) || d.color !== toRupees(p.costPerColorPagePaise)
    );
  }

  async function save(p: Printer) {
    const d = drafts[p.id];
    const bw = Number(d.bw);
    const color = Number(d.color);

    // Rejected here as well as server-side: a NaN would round to 0 and quietly
    // make a machine free.
    if (!Number.isFinite(bw) || !Number.isFinite(color) || bw < 0 || color < 0) {
      setRowError((e) => ({ ...e, [p.id]: "Enter a valid price." }));
      return;
    }

    setSavingId(p.id);
    setRowError((e) => ({ ...e, [p.id]: "" }));
    try {
      await apiFetch(`/printers/${p.id}`, {
        method: "PUT",
        body: {
          costPerBWPagePaise: Math.round(bw * 100),
          costPerColorPagePaise: Math.round(color * 100),
        },
      });
      setSavedId(p.id);
      await load();
      setTimeout(() => setSavedId(null), 2500);
    } catch (err) {
      setRowError((e) => ({
        ...e,
        [p.id]: err instanceof Error ? err.message : "Could not save.",
      }));
    }
    setSavingId(null);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        title="Pricing Rules"
        subtitle="What each machine charges per page. Customers see this before they print."
        action={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <LuRefreshCw size={13} /> Refresh
          </button>
        }
      />

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-start gap-2.5">
        <LuTriangleAlert size={15} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          An order is priced from the machine it&apos;s sent to, at the moment it&apos;s placed.
          Changing a price here doesn&apos;t affect orders already paid for.
        </p>
      </div>

      <Card>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : printers.length === 0 ? (
          <EmptyState
            icon={LuPrinter}
            title="No printers yet"
            hint="Register a printer and you can set its page rates here."
          />
        ) : (
          <>
            <CardHeader
              title="Per-page rates"
              subtitle="Entered in rupees. Colour is ignored on black-only machines."
            />
            <div className="divide-y divide-slate-100">
              {printers.map((p) => {
                const dirty = isDirty(p);
                const d = drafts[p.id] || { bw: "0", color: "0" };

                return (
                  <div key={p.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 text-sm truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          <span className="font-mono">{p.uniquePrinterId}</span>
                          {p.locationName ? ` · ${p.locationName}` : ""}
                        </p>
                      </div>

                      <div className="flex items-end gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            B&amp;W / page
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                              ₹
                            </span>
                            <input
                              value={d.bw}
                              onChange={(e) => edit(p.id, "bw", e.target.value)}
                              inputMode="decimal"
                              className="w-24 h-10 pl-6 pr-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-slate-400 transition-colors tabular-nums"
                            />
                          </div>
                        </div>

                        <div className={cx(!p.colorPrinting && "opacity-40")}>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Colour / page
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                              ₹
                            </span>
                            <input
                              value={d.color}
                              onChange={(e) => edit(p.id, "color", e.target.value)}
                              inputMode="decimal"
                              disabled={!p.colorPrinting}
                              className="w-24 h-10 pl-6 pr-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-slate-400 transition-colors tabular-nums disabled:bg-slate-50"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => save(p)}
                          disabled={!dirty || savingId === p.id}
                          className="h-10 inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <LuSave size={13} />
                          {savingId === p.id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[11px] text-slate-400">
                        Currently {inr(p.costPerBWPagePaise)} B&amp;W
                        {p.colorPrinting ? ` · ${inr(p.costPerColorPagePaise)} colour` : " · black only"}
                      </p>
                      {savedId === p.id && (
                        <span className="text-[11px] font-bold text-emerald-600">Saved</span>
                      )}
                      {rowError[p.id] && (
                        <span className="text-[11px] font-semibold text-rose-600">
                          {rowError[p.id]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
