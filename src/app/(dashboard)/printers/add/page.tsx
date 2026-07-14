"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LuArrowLeft,
  LuPrinter,
  LuWifi,
  LuMapPin,
  LuSlidersHorizontal,
  LuPlus,
  LuLoaderCircle,
  LuCircleAlert,
  LuCircleHelp,
  LuX,
  LuInfo,
  LuQrCode,
  LuRouter,
  LuMonitor,
} from "react-icons/lu";
import { apiFetch } from "@/lib/api";
import { Select } from "@/components/settings/fields";

const BRANDS = ["Canon", "HP", "Epson", "Brother", "Samsung", "Xerox", "Pantum", "Other"];
const PAPER_SIZES = ["A4", "A3", "A5", "Letter", "Legal"];

type FormData = {
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  ipAddress: string;
  macAddress: string;
  wifiSsid: string;
  accessPassword: string;
  locationName: string;
  shopName: string;
  ownerName: string;
  mobileNumber: string;
  emailAddress: string;
  address: string;
  supportedPaperSizes: string[];
  colorPrinting: boolean;
  duplexPrinting: boolean;
  costPerBWPagePaise: number;
  costPerColorPagePaise: number;
  status: string;
};

const initial: FormData = {
  name: "", brand: "Canon", model: "", serialNumber: "",
  ipAddress: "", macAddress: "", wifiSsid: "", accessPassword: "",
  locationName: "", shopName: "", ownerName: "",
  mobileNumber: "", emailAddress: "", address: "",
  supportedPaperSizes: ["A4"],
  colorPrinting: false, duplexPrinting: false,
  costPerBWPagePaise: 200, costPerColorPagePaise: 1000,
  status: "ONLINE",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-slate-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2.5 cursor-pointer select-none">
      <span className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-slate-900" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </button>
  );
}

const inputCls =
  "w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all";

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 mt-1.5 text-[11px] leading-relaxed text-slate-400">
      <LuInfo size={13} className="mt-px shrink-0 text-slate-400" />
      <span>{children}</span>
    </p>
  );
}

// ── How-to-register guide (modal tour) ───────────────────────────────────────
function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <LuCircleHelp size={18} />
            </span>
            <div>
              <p className="font-black text-slate-900 text-sm">How to register a printer</p>
              <p className="text-[11px] text-slate-400">A quick tour of every field</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <LuX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5 space-y-6 text-sm">
          <p className="text-slate-500">
            The printer must be a <b className="text-slate-700">WiFi / network printer</b> connected
            to the same network it will serve. Fill the four sections below, then Prinsta generates a
            unique Printer ID and a QR code automatically — no hardware setup needed.
          </p>

          <GuideStep n={1} icon={<LuPrinter size={16} />} title="Printer Details">
            <ul className="space-y-1.5">
              <li><b>Printer Name</b> — any label you recognise (e.g. &quot;Main Counter HP&quot;).</li>
              <li><b>Brand &amp; Model</b> — printed on the front of the device or its box.</li>
              <li>
                <b>Serial Number</b> — a sticker on the <i>back or bottom</i> of the printer
                (starts with letters, e.g. <code className="bg-slate-100 px-1 rounded">VNC3R12345</code>).
                Optional but useful for support.
              </li>
            </ul>
          </GuideStep>

          <GuideStep n={2} icon={<LuWifi size={16} />} title="Finding the IP &amp; MAC address">
            <p className="mb-2 text-slate-600 font-medium">This is the most important part. Use any one method:</p>
            <div className="space-y-3">
              <Method icon={<LuMonitor size={15} />} title="From the printer's own screen">
                On the printer&apos;s control panel go to <b>Menu → Network / Wireless →
                Wi-Fi / TCP-IP Settings</b>. It shows the <b>IP Address</b> (e.g.
                <code className="bg-slate-100 px-1 rounded mx-1">192.168.1.100</code>) and the
                <b> MAC / Hardware Address</b> (e.g.
                <code className="bg-slate-100 px-1 rounded mx-1">00:1A:2B:3C:4D:5E</code>).
              </Method>
              <Method icon={<LuPrinter size={15} />} title="Print a network config page">
                Most printers can print a <b>Network Configuration / Wireless Test</b> report.
                Hold the printer&apos;s <b>Wi-Fi</b> or <b>Info (ⓘ)</b> button for ~5s, or find it under
                <b> Settings → Reports</b>. The IP and MAC are listed there.
              </Method>
              <Method icon={<LuRouter size={15} />} title="From your WiFi router">
                Open your router admin page (usually
                <code className="bg-slate-100 px-1 rounded mx-1">192.168.1.1</code>) →
                <b> Connected Devices / DHCP Client List</b>. Find the printer by its name; the
                row shows its IP and MAC.
              </Method>
            </div>
            <div className="mt-3 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <LuInfo size={13} className="mt-px shrink-0" />
              <span>Tip: reserve a <b>static IP</b> for the printer in your router so the address never changes.</span>
            </div>
          </GuideStep>

          <GuideStep n={3} icon={<LuMapPin size={16} />} title="Location &amp; Owner">
            Enter the shop/store name, a human-friendly location (&quot;Ground floor, near Gate 2&quot;),
            and the owner&apos;s contact details. Users see the shop name when they scan the QR code.
          </GuideStep>

          <GuideStep n={4} icon={<LuSlidersHorizontal size={16} />} title="Capabilities &amp; Pricing">
            Pick the supported paper sizes, toggle Color / Duplex if the printer supports them, and
            set the per-page price in ₹. The color price field only appears when Color is enabled.
          </GuideStep>

          <GuideStep n={5} icon={<LuQrCode size={16} />} title="After you submit">
            Prinsta assigns a unique <b>Printer ID</b> (e.g.
            <code className="bg-slate-100 px-1 rounded mx-1">PRN-AB12CD</code>) and generates a
            <b> QR code</b>. Print it and stick it on the printer — users scan it to connect and print.
            You can view, download or regenerate the QR anytime from <b>QR Codes</b> or the printer&apos;s detail page.
          </GuideStep>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-xl transition-colors">
            Got it, let&apos;s register
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideStep({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">{n}</span>
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-bold text-slate-800">
          <span className="text-slate-500">{icon}</span> {title}
        </p>
        <div className="mt-1 text-slate-500 text-[13px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Method({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
        <span className="text-slate-500">{icon}</span> {title}
      </p>
      <p className="mt-1 text-[12px] text-slate-500 leading-relaxed">{children}</p>
    </div>
  );
}

function SectionHead({ icon, step, title, desc }: { icon: React.ReactNode; step: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-400">STEP {step}</span>
        </h3>
        <p className="text-base font-bold text-slate-800 leading-tight">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

export default function AddPrinterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function togglePaperSize(size: string) {
    set("supportedPaperSizes", form.supportedPaperSizes.includes(size)
      ? form.supportedPaperSizes.filter((s) => s !== size)
      : [...form.supportedPaperSizes, size]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ printer: { id: string; uniquePrinterId: string } }>("/printers", {
        method: "POST",
        body: {
          ...form,
          costPerBWPagePaise: Number(form.costPerBWPagePaise),
          costPerColorPagePaise: Number(form.costPerColorPagePaise),
          emailAddress: form.emailAddress || undefined,
          wifiSsid: form.wifiSsid || undefined,
          accessPassword: form.accessPassword || undefined,
        },
      });
      router.push(`/printers/${res.printer.id}?registered=1`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to register printer");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/printers" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors">
          <LuArrowLeft size={16} /> Back to Printers
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Register New Printer</h1>
            <p className="text-slate-400 text-sm mt-1">Add a WiFi printer to the network. A unique ID and QR code are generated automatically.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <LuCircleHelp size={16} /> How to register?
          </button>
        </div>
      </div>

      {/* Helpful banner */}
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="w-full text-left mb-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-100/60 px-4 py-3.5 hover:bg-slate-100 transition-colors"
      >
        <span className="w-9 h-9 rounded-xl bg-white text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
          <LuInfo size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-800">First time? Take the quick tour</span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Learn where to find the printer&apos;s IP address, MAC address, serial number and what happens after you submit.
          </span>
        </span>
      </button>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <SectionHead icon={<LuPrinter size={20} />} step={1} title="Printer Details" desc="Basic identity of the device" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Printer Name" required>
                <input className={inputCls} placeholder="e.g. HP LaserJet – Main Counter" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
            </div>
            <Field label="Brand" required>
              <Select value={form.brand} onChange={(v) => set("brand", v)} className="w-full" options={BRANDS.map((b) => ({ value: b, label: b }))} />
            </Field>
            <Field label="Model" required>
              <input className={inputCls} placeholder="e.g. LaserJet Pro M404n" value={form.model} onChange={(e) => set("model", e.target.value)} required />
            </Field>
            <Field label="Serial Number">
              <input className={inputCls} placeholder="e.g. VNC3R12345" value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
              <Hint>On a sticker on the back/bottom of the printer.</Hint>
            </Field>
            <Field label="Initial Status">
              <Select value={form.status} onChange={(v) => set("status", v)} className="w-full" options={[
                { value: "ONLINE", label: "Online" },
                { value: "OFFLINE", label: "Offline" },
              ]} />
            </Field>
          </div>
        </section>

        {/* Network */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <SectionHead icon={<LuWifi size={20} />} step={2} title="Network Configuration" desc="How the platform reaches the printer" />
            <button type="button" onClick={() => setShowGuide(true)} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 shrink-0 mt-1">
              <LuCircleHelp size={13} /> Where do I find these?
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="IP Address" required>
              <input className={inputCls} placeholder="192.168.1.100" value={form.ipAddress} onChange={(e) => set("ipAddress", e.target.value)} required />
              <Hint>Printer&apos;s screen → Network settings, or print a Network Config page. <button type="button" onClick={() => setShowGuide(true)} className="text-slate-500 font-semibold hover:underline">See guide</button></Hint>
            </Field>
            <Field label="MAC Address">
              <input className={inputCls} placeholder="00:1A:2B:3C:4D:5E" value={form.macAddress} onChange={(e) => set("macAddress", e.target.value)} />
              <Hint>Also called &quot;Hardware Address&quot; — shown next to the IP on the same screen/report.</Hint>
            </Field>
            <Field label="Wi-Fi Direct Name (SSID)">
              <input className={inputCls} placeholder="DIRECT-Pantum-BP5100" value={form.wifiSsid} onChange={(e) => set("wifiSsid", e.target.value)} />
              <Hint>The printer&apos;s own Wi-Fi Direct network name — printer settings → Network → Wi-Fi Direct. The app joins this to print without shop internet.</Hint>
            </Field>
            <Field label="Wi-Fi Direct Password">
              <input type="password" autoComplete="new-password" className={inputCls} placeholder="Printer Wi-Fi Direct password" value={form.accessPassword} onChange={(e) => set("accessPassword", e.target.value)} />
              <Hint>The password to join the printer&apos;s Wi-Fi Direct. Shown on the printer&apos;s Wi-Fi Direct settings screen.</Hint>
            </Field>
          </div>
        </section>

        {/* Location & Owner */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <SectionHead icon={<LuMapPin size={20} />} step={3} title="Location & Owner" desc="Where the printer lives and who runs it" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Shop / Store Name" required>
              <input className={inputCls} placeholder="e.g. Raju Xerox Center" value={form.shopName} onChange={(e) => set("shopName", e.target.value)} required />
            </Field>
            <Field label="Location Name" required>
              <input className={inputCls} placeholder="e.g. Ground Floor, Near Gate 2" value={form.locationName} onChange={(e) => set("locationName", e.target.value)} required />
            </Field>
            <Field label="Owner Name" required>
              <input className={inputCls} placeholder="Full name" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} required />
            </Field>
            <Field label="Mobile Number" required>
              <input className={inputCls} placeholder="10-digit mobile" value={form.mobileNumber} onChange={(e) => set("mobileNumber", e.target.value)} required />
            </Field>
            <Field label="Email Address">
              <input type="email" className={inputCls} placeholder="owner@email.com" value={form.emailAddress} onChange={(e) => set("emailAddress", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <textarea className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 resize-none transition-all" rows={2} placeholder="Full shop address" value={form.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <SectionHead icon={<LuSlidersHorizontal size={20} />} step={4} title="Capabilities & Pricing" desc="What the printer supports and what it charges" />
          <div className="space-y-6">
            <Field label="Supported Paper Sizes" required>
              <div className="flex flex-wrap gap-2 mt-1">
                {PAPER_SIZES.map((size) => {
                  const active = form.supportedPaperSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => togglePaperSize(size)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                        active
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <Toggle on={form.colorPrinting} onClick={() => set("colorPrinting", !form.colorPrinting)} label="Color Printing" />
              <Toggle on={form.duplexPrinting} onClick={() => set("duplexPrinting", !form.duplexPrinting)} label="Duplex (Double-Sided)" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="B&W Cost (per page)" required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number" min={0} step={0.5}
                    className={inputCls + " pl-8"}
                    value={form.costPerBWPagePaise / 100}
                    onChange={(e) => set("costPerBWPagePaise", Math.round(parseFloat(e.target.value || "0") * 100))}
                    required
                  />
                </div>
              </Field>
              {form.colorPrinting && (
                <Field label="Color Cost (per page)" required>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                    <input
                      type="number" min={0} step={0.5}
                      className={inputCls + " pl-8"}
                      value={form.costPerColorPagePaise / 100}
                      onChange={(e) => set("costPerColorPagePaise", Math.round(parseFloat(e.target.value || "0") * 100))}
                      required
                    />
                  </div>
                </Field>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">
            <LuCircleAlert size={16} className="shrink-0" /> {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pb-2 sticky bottom-0 bg-slate-50/80 backdrop-blur py-3 -mx-1 px-1 rounded-xl">
          <Link href="/printers" className="text-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors px-5 py-3 rounded-xl border border-slate-200 bg-white sm:border-0 sm:bg-transparent">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
          >
            {loading ? <><LuLoaderCircle size={16} className="animate-spin" /> Registering…</> : <><LuPlus size={16} /> Register Printer &amp; Generate QR</>}
          </button>
        </div>
      </form>
    </div>
  );
}
