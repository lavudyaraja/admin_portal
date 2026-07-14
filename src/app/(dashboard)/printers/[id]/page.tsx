"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Select } from "@/components/settings/fields";

interface PrinterDetail {
  id: string;
  uniquePrinterId: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string | null;
  ipAddress: string;
  macAddress: string | null;
  status: string;
  locationName: string;
  shopName: string;
  ownerName: string;
  mobileNumber: string;
  emailAddress: string | null;
  address: string | null;
  supportedPaperSizes: string[];
  colorPrinting: boolean;
  duplexPrinting: boolean;
  costPerBWPagePaise: number;
  costPerColorPagePaise: number;
  paperLevel: number;
  tonerLevel: number;
  lastSeenAt: string | null;
  qrCode: string | null;
  qrData: string | null;
  createdAt: string;
  _count: { orders: number; printJobs: number };
  orders: Array<{ id: string; orderCode: string; status: string; costPaise: number; createdAt: string }>;
}

const statusColors: Record<string, string> = {
  ONLINE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OFFLINE: "bg-zinc-100 text-zinc-500 border-zinc-200",
  BUSY: "bg-amber-100 text-amber-700 border-amber-200",
  ERROR: "bg-rose-100 text-rose-700 border-rose-200",
  OUT_OF_PAPER: "bg-orange-100 text-orange-700 border-orange-200",
  LOW_TONER: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const orderStatusColors: Record<string, string> = {
  COMPLETED: "text-emerald-600",
  FAILED: "text-rose-500",
  PRINTING: "text-blue-500",
  READY: "text-violet-500",
  PAID: "text-orange-500",
  CANCELLED: "text-zinc-400",
};

export default function PrinterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [printer, setPrinter] = useState<PrinterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [regeneratingQR, setRegeneratingQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(justRegistered);

  useEffect(() => {
    apiFetch<{ printer: PrinterDetail }>(`/printers/${id}`)
      .then((r) => setPrinter(r.printer))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  async function updateStatus(status: string) {
    if (!printer) return;
    setUpdatingStatus(true);
    try {
      const res = await apiFetch<{ printer: PrinterDetail }>(`/printers/${id}`, {
        method: "PUT",
        body: { status },
      });
      // The update response omits the `_count`/`orders` relations — merge so we
      // don't drop them (and crash on re-render).
      setPrinter((prev) => (prev ? { ...prev, ...res.printer } : res.printer));
    } catch {}
    setUpdatingStatus(false);
  }

  async function regenerateQR() {
    setRegeneratingQR(true);
    try {
      const res = await apiFetch<{ printer: PrinterDetail }>(`/printers/${id}/regenerate-qr`, { method: "POST" });
      setPrinter((prev) => (prev ? { ...prev, ...res.printer } : res.printer));
    } catch {}
    setRegeneratingQR(false);
  }

  function downloadQR() {
    if (!printer?.qrCode) return;
    const a = document.createElement("a");
    a.href = printer.qrCode;
    a.download = `${printer.uniquePrinterId}-qr.png`;
    a.click();
  }

  if (loading) {
    return <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">Loading…</div>;
  }

  if (!printer) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-800 font-bold">Printer not found</p>
        <a href="/printers" className="text-orange-500 text-sm font-medium mt-2 inline-block">← Back to Printers</a>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Success banner */}
      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-bold text-emerald-800">Printer registered successfully!</p>
            <p className="text-emerald-700 text-sm">{printer.name} · ID: {printer.uniquePrinterId} · QR Code generated</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <a href="/printers" className="text-zinc-400 hover:text-zinc-700 text-sm font-medium transition-colors">← Printers</a>
          <span className="text-zinc-200">/</span>
          <div>
            <h2 className="text-xl font-black text-zinc-900">{printer.name}</h2>
            <p className="text-zinc-400 text-sm font-mono">{printer.uniquePrinterId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusColors[printer.status]}`}>
            {printer.status.replace("_", " ")}
          </span>
          <Select
            value={printer.status}
            onChange={updateStatus}
            disabled={updatingStatus}
            className="w-44"
            options={["ONLINE","OFFLINE","BUSY","ERROR","OUT_OF_PAPER","LOW_TONER"].map((s) => ({ value: s, label: s.replace("_", " ") }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* QR Code */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col items-center gap-4">
          <h3 className="text-sm font-bold text-zinc-700 self-start">QR Code</h3>
          {printer.qrCode ? (
            <img src={printer.qrCode} alt="QR Code" className="w-48 h-48 rounded-lg" />
          ) : (
            <div className="w-48 h-48 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 text-sm">
              No QR
            </div>
          )}
          <p className="text-[10px] text-zinc-400 text-center break-all">{printer.qrData}</p>
          <div className="flex gap-2 w-full">
            <button
              onClick={downloadQR}
              disabled={!printer.qrCode}
              className="flex-1 text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white py-2 rounded-xl transition-colors"
            >
              Download
            </button>
            <button
              onClick={regenerateQR}
              disabled={regeneratingQR}
              className="flex-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2 rounded-xl transition-colors"
            >
              {regeneratingQR ? "…" : "Regenerate"}
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Printer Info</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ["Brand", printer.brand],
                ["Model", printer.model],
                ["Serial No.", printer.serialNumber || "—"],
                ["IP Address", printer.ipAddress],
                ["MAC Address", printer.macAddress || "—"],
                ["Paper Sizes", printer.supportedPaperSizes.join(", ")],
                ["Color Printing", printer.colorPrinting ? "Yes" : "No"],
                ["Duplex", printer.duplexPrinting ? "Yes" : "No"],
                ["B&W Price", `₹${(printer.costPerBWPagePaise / 100).toFixed(2)}/pg`],
                ["Color Price", printer.colorPrinting ? `₹${(printer.costPerColorPagePaise / 100).toFixed(2)}/pg` : "N/A"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-zinc-400 text-xs">{k}</dt>
                  <dd className="font-semibold text-zinc-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Location & Owner</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ["Shop Name", printer.shopName],
                ["Location", printer.locationName],
                ["Owner", printer.ownerName],
                ["Mobile", printer.mobileNumber],
                ["Email", printer.emailAddress || "—"],
                ["Address", printer.address || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-zinc-400 text-xs">{k}</dt>
                  <dd className="font-semibold text-zinc-800 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Orders", value: printer._count?.orders ?? 0 },
              { label: "Paper Level", value: `${printer.paperLevel}%` },
              { label: "Toner Level", value: `${printer.tonerLevel}%` },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-zinc-200 p-4 text-center">
                <p className="text-xl font-black text-zinc-900">{s.value}</p>
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {printer.orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-800">Recent Orders</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                {["Order Code", "Status", "Amount", "Date"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printer.orders.map((o) => (
                <tr key={o.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-zinc-700">{o.orderCode}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold ${orderStatusColors[o.status] || "text-zinc-500"}`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-zinc-900">₹{(o.costPaise / 100).toFixed(2)}</td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
