"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { LuWifi, LuDownload, LuPrinter, LuEye, LuEyeOff, LuTriangleAlert } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";
import { buildWifiQrPayload } from "@/lib/vendor/wifiQr";

interface Printer {
  id: string;
  name: string;
  brand: string;
  wifiSsid: string | null;
  locationName: string;
  shopName: string;
}

export default function WifiQrPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  // Offer the registered printers as one-tap fill.
  useEffect(() => {
    apiFetch<{ printers: Printer[] }>("/printers")
      .then((r) => setPrinters(r.printers.filter((p) => p.wifiSsid)))
      .catch(() => {});
  }, []);

  const payload = useMemo(
    () => (ssid.trim() ? buildWifiQrPayload({ ssid: ssid.trim(), password }) : ""),
    [ssid, password],
  );

  // Re-render the QR whenever the credentials change.
  useEffect(() => {
    if (!payload) { setDataUrl(""); return; }
    let alive = true;
    QRCode.toDataURL(payload, { width: 600, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => { if (alive) { setDataUrl(url); setError(""); } })
      .catch(() => { if (alive) setError("Couldn't generate the QR code."); });
    return () => { alive = false; };
  }, [payload]);

  function usePrinter(p: Printer) {
    setSsid(p.wifiSsid || "");
    setLabel(`${p.brand} ${p.name} · ${p.locationName}`);
  }

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${(label || ssid).replace(/[^\w-]+/g, "_")}-wifi-qr.png`;
    a.click();
  }

  function printSheet() {
    if (!dataUrl) return;
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    w.document.write(`
      <html><head><title>${label || ssid} — Wi-Fi QR</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:48px 32px;color:#111}
        h1{font-size:26px;margin:0 0 6px}
        p{color:#666;margin:0 0 28px;font-size:14px}
        img{width:340px;height:340px}
        .net{margin-top:22px;font-size:15px;font-weight:700}
        .hint{margin-top:10px;font-size:13px;color:#666}
      </style></head>
      <body>
        <h1>Scan to Print</h1>
        <p>${label || "Prinsta printer"}</p>
        <img src="${dataUrl}" />
        <div class="net">${ssid}</div>
        <div class="hint">Open the Prinsta app → scan this code → your document prints here.</div>
        <script>window.onload = () => window.print();</script>
      </body></html>`);
    w.document.close();
  }

  const input =
    "w-full text-sm border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-400 transition-colors";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-black text-zinc-900">Printer Wi-Fi QR</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Generate the QR students scan to join a printer&apos;s Wi-Fi — print it and paste it on the machine.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Details ── */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <LuWifi size={18} className="text-orange-500" />
            <h3 className="font-bold text-zinc-900">Network details</h3>
          </div>

          {printers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-600 mb-2">Use a registered printer</p>
              <div className="flex flex-wrap gap-2">
                {printers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => usePrinter(p)}
                    className="text-xs font-semibold bg-zinc-100 hover:bg-orange-50 hover:text-orange-700 text-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {p.brand} {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-zinc-600">
              Wi-Fi name (SSID) <span className="text-rose-500">*</span>
            </span>
            <input
              className={`${input} mt-1`}
              placeholder="DIRECT-q2-Pantum BP5100 Series"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
            />
            <span className="block text-[11px] text-zinc-400 mt-1">
              Exactly as the printer broadcasts it — check the printer&apos;s Wi-Fi Direct screen.
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-600">Wi-Fi password</span>
            <div className="relative mt-1">
              <input
                className={`${input} pr-11`}
                type={showPassword ? "text" : "password"}
                autoComplete="off"
                placeholder="Leave blank for an open network"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-600">Label on the printout</span>
            <input
              className={`${input} mt-1`}
              placeholder="Pantum BP5100 · CSE Center"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              <LuTriangleAlert size={15} className="text-rose-600" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* ── Preview ── */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col items-center">
          <h3 className="font-bold text-zinc-900 self-start mb-4">Preview</h3>

          {dataUrl ? (
            <>
              <div ref={printRef} className="rounded-2xl border border-zinc-200 p-5 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dataUrl} alt="Printer Wi-Fi QR" className="w-56 h-56" />
                <p className="mt-3 font-bold text-zinc-900 text-sm">{label || "Prinsta printer"}</p>
                <p className="text-xs text-zinc-400 break-all mt-0.5">{ssid}</p>
              </div>

              <div className="flex gap-2 mt-5 w-full">
                <button
                  onClick={download}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl transition-colors"
                >
                  <LuDownload size={15} /> Download PNG
                </button>
                <button
                  onClick={printSheet}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-2.5 rounded-xl transition-colors"
                >
                  <LuPrinter size={15} /> Print sheet
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 text-center mt-4 leading-relaxed">
                Paste this on the printer. Students scan it in the Prinsta app to connect — no password typing.
              </p>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <span className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
                <LuWifi size={24} />
              </span>
              <p className="text-sm font-semibold text-zinc-700">Enter a Wi-Fi name</p>
              <p className="text-xs text-zinc-400 mt-1">The QR appears here as you type.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
