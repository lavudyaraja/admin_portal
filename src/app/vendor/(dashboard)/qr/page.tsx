"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { LuQrCode, LuDownload, LuRefreshCw, LuChevronRight, LuX, LuSearch } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { buildQrSheet } from "@/lib/vendor/qrSheet";

interface PrinterLite {
  id: string;
  uniquePrinterId: string;
  name: string;
  shopName: string;
  locationName: string;
  status: string;
}
interface PrinterFull extends PrinterLite {
  qrCode: string | null;
  qrData: string | null;
}

/** Compact online/offline marker — one more way to tell two printers apart. */
function StatusDot({ status }: { status: string }) {
  const tone =
    status === "ONLINE" ? "bg-emerald-500"
    : status === "BUSY" || status === "PRINTING" ? "bg-amber-500"
    : status === "ERROR" ? "bg-rose-500"
    : "bg-slate-300";
  return (
    <span className="hidden sm:flex items-center gap-1.5 shrink-0" title={status}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone}`} />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{status}</span>
    </span>
  );
}

export default function QrPage() {
  const [printers, setPrinters] = useState<PrinterLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PrinterFull | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ printers: PrinterLite[] }>("/printers?limit=200");
      setPrinters(res.printers);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // A shop with a handful of printers scrolls; one with a fleet needs to search.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return printers;
    return printers.filter((p) =>
      [p.name, p.uniquePrinterId, p.locationName, p.shopName]
        .some((f) => (f || "").toLowerCase().includes(q))
    );
  }, [printers, search]);

  async function select(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await apiFetch<{ printer: PrinterFull }>(`/printers/${id}`);
      setSelected(res.printer);
    } catch {}
    setDetailLoading(false);
  }

  async function regenerate() {
    if (!selected) return;
    setRegenerating(true);
    try {
      const res = await apiFetch<{ printer: PrinterFull }>(`/printers/${selected.id}/regenerate-qr`, { method: "POST" });
      setSelected((s) => (s ? { ...s, qrCode: res.printer.qrCode, qrData: res.printer.qrData } : s));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to regenerate");
    }
    setRegenerating(false);
  }

  /** Reissue every printer's QR in the new (Wi-Fi) format in one go. */
  async function regenerateAll() {
    if (regeneratingAll) return;
    if (!confirm("Reissue the QR code for every one of your printers? Reprint and re-tape the new sheets afterwards.")) return;
    setRegeneratingAll(true);
    try {
      const res = await apiFetch<{ updated: number; total: number }>("/printers/regenerate-all-qr", { method: "POST" });
      if (selectedId) await select(selectedId); // refresh the open one's image
      alert(`Reissued ${res.updated} of ${res.total} QR codes. Download and re-tape the new sheets.`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to regenerate all QR codes.");
    }
    setRegeneratingAll(false);
  }

  /**
   * Downloads the QR as a labelled sheet rather than a bare code. With several
   * printers the bare images are indistinguishable once saved or printed, and
   * taping the wrong one to a machine sends every job to the wrong tray.
   */
  async function download() {
    if (!selected?.qrCode) return;
    setDownloading(true);
    try {
      const sheet = await buildQrSheet({
        qrCode: selected.qrCode,
        name: selected.name,
        uniquePrinterId: selected.uniquePrinterId,
        locationName: selected.locationName,
        shopName: selected.shopName,
      });
      const a = document.createElement("a");
      a.href = sheet;
      // Name it after the printer too, so the file is identifiable before it is
      // even opened.
      a.download = `prinsta-${selected.uniquePrinterId}-${selected.name.replace(/[^\w-]+/g, "-")}.png`;
      a.click();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Could not build the QR sheet.");
    }
    setDownloading(false);
  }

  function closeMobile() {
    setSelectedId(null);
    setSelected(null);
  }

  const detail = (
    <>
      {detailLoading ? (
        <p className="text-slate-400 text-sm py-10">Loading…</p>
      ) : !selected ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3"><LuQrCode size={26} /></div>
          <p className="text-slate-500 text-sm font-medium">Select a printer</p>
          <p className="text-slate-400 text-xs mt-1">to view and download its QR code</p>
        </div>
      ) : (
        <div className="text-center w-full">
          <p className="font-bold text-slate-900">{selected.name}</p>
          <p className="text-xs font-mono text-rose-600">{selected.uniquePrinterId}</p>
          {(selected.locationName || selected.shopName) && (
            <p className="text-[11px] text-slate-400 mb-3 mt-0.5">
              {[selected.locationName, selected.shopName].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="mb-4" />
          {selected.qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.qrCode} alt="QR code" className="w-48 h-48 mx-auto rounded-xl border border-slate-100" />
          ) : (
            <div className="w-48 h-48 mx-auto rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-sm">No QR</div>
          )}
          {selected.qrData && <p className="text-[10px] text-slate-400 mt-3 break-all px-2">{selected.qrData}</p>}
          <div className="flex gap-2 mt-5">
            <button onClick={download} disabled={!selected.qrCode || downloading} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-40 transition-colors">
              <LuDownload size={14} /> {downloading ? "Preparing…" : "Download sheet"}
            </button>
            <button onClick={regenerate} disabled={regenerating} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-400 disabled:opacity-40 transition-colors">
              <LuRefreshCw size={14} className={regenerating ? "animate-spin" : ""} /> {regenerating ? "…" : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">QR Codes</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            One QR per printer — download the labelled sheet and tape it to that machine. Scanning it
            joins the printer&apos;s Wi-Fi and prints.
          </p>
        </div>
        {printers.length > 0 && (
          <button
            onClick={regenerateAll}
            disabled={regeneratingAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-400 disabled:opacity-40 transition-colors shrink-0"
          >
            <LuRefreshCw size={14} className={regeneratingAll ? "animate-spin" : ""} />
            {regeneratingAll ? "Reissuing…" : "Regenerate all"}
          </button>
        )}
      </div>

      {printers.length > 3 && (
        <div className="relative max-w-md">
          <LuSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by printer name, ID or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 transition-all"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : printers.length === 0 ? (
            <div className="p-12 sm:p-16 text-center text-slate-400 text-sm">No printers registered.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((p) => {
                const active = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => select(p.id)}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left transition-colors ${
                      active ? "bg-rose-50/70" : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* The selected printer gets the brand tint, so which QR is
                        on screen stays obvious in a list of near-identical rows. */}
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? "bg-rose-100" : "bg-slate-100"
                      }`}
                    >
                      <LuQrCode size={17} className={active ? "text-rose-600" : "text-slate-500"} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold truncate ${active ? "text-rose-700" : "text-slate-900"}`}>
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        <span className="font-mono">{p.uniquePrinterId}</span>
                        {p.locationName ? ` · ${p.locationName}` : ""}
                        {p.shopName ? ` · ${p.shopName}` : ""}
                      </p>
                    </div>
                    <StatusDot status={p.status} />
                    <LuChevronRight size={16} className="text-slate-300 shrink-0" />
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No printers match “{search}”.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail — desktop sticky panel */}
        <div className="hidden lg:flex bg-white rounded-2xl border border-slate-200 p-6 flex-col items-center justify-center min-h-80 lg:sticky lg:top-20">
          {detail}
        </div>
      </div>

      {/* Detail — mobile bottom sheet */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 lg:hidden" onClick={closeMobile}>
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end -mt-2 -mr-2 mb-1">
              <button onClick={closeMobile} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"><LuX size={19} /></button>
            </div>
            <div className="flex flex-col items-center">{detail}</div>
          </div>
        </div>
      )}
    </div>
  );
}
