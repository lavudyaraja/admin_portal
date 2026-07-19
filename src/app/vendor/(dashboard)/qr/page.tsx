"use client";

import { useEffect, useState, useCallback } from "react";
import { LuQrCode, LuDownload, LuRefreshCw, LuChevronRight, LuX } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";

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

export default function QrPage() {
  const [printers, setPrinters] = useState<PrinterLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PrinterFull | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ printers: PrinterLite[] }>("/printers?limit=200");
      setPrinters(res.printers);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  function download() {
    if (!selected?.qrCode) return;
    const a = document.createElement("a");
    a.href = selected.qrCode;
    a.download = `${selected.uniquePrinterId}-qr.png`;
    a.click();
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
          <p className="text-xs text-slate-400 font-mono mb-4">{selected.uniquePrinterId}</p>
          {selected.qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.qrCode} alt="QR code" className="w-48 h-48 mx-auto rounded-xl border border-slate-100" />
          ) : (
            <div className="w-48 h-48 mx-auto rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-sm">No QR</div>
          )}
          {selected.qrData && <p className="text-[10px] text-slate-400 mt-3 break-all px-2">{selected.qrData}</p>}
          <div className="flex gap-2 mt-5">
            <button onClick={download} disabled={!selected.qrCode} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 transition-colors">
              <LuDownload size={14} /> Download
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
      <div>
        <h1 className="text-2xl font-black text-slate-900">QR Codes</h1>
        <p className="text-slate-400 text-sm mt-0.5">Printer QR codes — users scan these to connect.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : printers.length === 0 ? (
            <div className="p-12 sm:p-16 text-center text-slate-400 text-sm">No printers registered.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {printers.map((p) => {
                const active = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => select(p.id)}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left transition-colors ${active ? "bg-slate-50" : "hover:bg-slate-50/60"}`}
                  >
                    <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><LuQrCode size={17} className="text-slate-500" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400 truncate"><span className="font-mono">{p.uniquePrinterId}</span> · {p.shopName}</p>
                    </div>
                    <LuChevronRight size={16} className="text-slate-300 shrink-0" />
                  </button>
                );
              })}
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
