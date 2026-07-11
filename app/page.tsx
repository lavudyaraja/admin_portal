"use client";

import { useEffect, useState, useCallback } from "react";
import { api, apiLogin, apiRegisterAdmin, getToken, setToken, clearToken } from "./lib/api";

const rupees = (p: number) => "₹" + ((p || 0) / 100).toFixed(2);

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  PRINTING: "bg-amber-100 text-amber-700",
  PAID: "bg-indigo-100 text-indigo-700",
  READY: "bg-indigo-100 text-indigo-700",
  PENDING: "bg-slate-100 text-slate-600",
  FAILED: "bg-rose-100 text-rose-600",
  CANCELLED: "bg-rose-100 text-rose-600",
};
const barColor = (v: number) => (v > 40 ? "#059669" : v > 20 ? "#d97706" : "#e11d48");

type View = "dashboard" | "orders" | "kiosks" | "users";

const NAV: { key: View; label: string; icon: IconName }[] = [
  { key: "dashboard", label: "Dashboard", icon: "grid" },
  { key: "orders", label: "Orders", icon: "orders" },
  { key: "kiosks", label: "Kiosks", icon: "printer" },
  { key: "users", label: "Students", icon: "users" },
];

export default function Page() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!getToken()); }, []);
  return authed ? <Shell onLogout={() => setAuthed(false)} /> : <Login onDone={() => setAuthed(true)} />;
}

/* ---------------- Auth (login + register) ---------------- */
type IconName = "mail" | "lock" | "user" | "phone" | "key" | "eye" | "eyeOff"
  | "grid" | "orders" | "printer" | "users" | "logout" | "refresh";

function Ic({ name, className = "w-[18px] h-[18px]" }: { name: IconName; className?: string }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className };
  switch (name) {
    case "mail": return <svg {...common}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></svg>;
    case "lock": return <svg {...common}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case "user": return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case "phone": return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case "key": return <svg {...common}><path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3" /></svg>;
    case "eye": return <svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "eyeOff": return <svg {...common}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /></svg>;
    case "grid": return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "orders": return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" /></svg>;
    case "printer": return <svg {...common}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" /></svg>;
    case "users": return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "logout": return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
    case "refresh": return <svg {...common}><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
  }
}

function IconField({ label, icon, isPassword, value, onChange, ...props }: {
  label: string; icon: IconName; isPassword?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      <label className="text-sm font-bold text-slate-800">{label}</label>
      <div className="relative mt-1.5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Ic name={icon} /></span>
        <input {...props} value={value} onChange={onChange} type={isPassword && !show ? "password" : props.type || "text"}
          className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-[15px] outline-none focus:border-indigo-500 transition placeholder:text-slate-400" />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <Ic name={show ? "eyeOff" : "eye"} />
          </button>
        )}
      </div>
    </div>
  );
}

function GoogleBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition">
      <svg viewBox="0 0 48 48" className="w-5 h-5">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 4.1 29.3 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.5-.2-2.6-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 4.1 29.3 2 24 2 15.6 2 8.3 6.8 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 46c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 37.2 26.7 38 24 38c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C8.1 41.1 15.5 46 24 46z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C39.9 36.4 44 31 44 24c0-1.5-.2-2.6-.4-3.5z" />
      </svg>
      Continue with Google
    </button>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(""); setLoading(true);
    try {
      if (tab === "login") {
        const { token, user } = await apiLogin(phone.trim(), password);
        if (user.role !== "ADMIN") throw new Error("This account is not an admin.");
        setToken(token);
      } else {
        if (name.trim().length < 2) throw new Error("Enter your full name");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        const { token } = await apiRegisterAdmin({
          name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, password, adminCode: adminCode.trim(),
        });
        setToken(token);
      }
      onDone();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  const googleAlert = () => alert("Google sign-in isn't configured for the admin console. Use your mobile number & password.");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl mb-3" style={{ background: "var(--p)" }}>🖨️</div>
          <div className="text-xl font-extrabold">Print<span style={{ color: "var(--p)" }}>Hub</span></div>
          <div className="text-sm text-slate-400">Admin Console</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-7">
          <h1 className="text-xl font-bold mb-1">{tab === "login" ? "Welcome back" : "Create account"}</h1>
          <p className="text-sm text-slate-400 mb-6">
            {tab === "login" ? "Sign in to your operator dashboard." : "Register a new operator account."}
          </p>

          {tab === "register" && (
            <IconField label="Full Name" icon="user" value={name} onChange={(e) => setName(e.target.value)} placeholder="Operator name" />
          )}
          <IconField label="Mobile Number" icon="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} placeholder="9999999999" inputMode="numeric" />
          {tab === "register" && (
            <IconField label="Email (optional)" icon="mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          )}
          <IconField label="Password" icon="lock" isPassword value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Enter your password" />
          {tab === "register" && (
            <IconField label="Admin Signup Code" icon="key" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="PRINTHUB-ADMIN-2026" />
          )}

          {tab === "login" && (
            <div className="flex items-center justify-between mb-5 -mt-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
                Remember me
              </label>
              <button type="button" onClick={() => alert("Contact a super-admin to reset an operator password.")} className="text-sm font-semibold" style={{ color: "var(--p)" }}>Forgot password?</button>
            </div>
          )}

          <button onClick={submit} disabled={loading} className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-60 transition" style={{ background: "var(--p)" }}>
            {loading ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
          </button>
          {err && <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-600">{err}</div>}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 tracking-wider">OR CONTINUE WITH</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <GoogleBtn onClick={googleAlert} />

          <p className="text-sm text-slate-500 text-center mt-6">
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => { setTab(tab === "login" ? "register" : "login"); setErr(""); }} className="font-bold" style={{ color: "var(--p)" }}>
              {tab === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {tab === "login" && <p className="text-xs text-slate-400 mt-5 text-center">Demo — 9999999999 / admin123</p>}
      </div>
    </div>
  );
}

/* ---------------- Shell (sidebar + navbar) ---------------- */
function Shell({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<View>("dashboard");
  const [me, setMe] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [kiosks, setKiosks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => { api("/auth/me").then((r) => setMe(r.user)).catch(() => {}); }, []);

  const refresh = useCallback(async () => {
    try {
      const [m, k, o, u] = await Promise.all([
        api("/admin/metrics"), api("/admin/kiosks"), api("/admin/orders"), api("/admin/users"),
      ]);
      setMetrics(m); setKiosks(k.kiosks); setOrders(o.orders); setUsers(u.users);
    } catch (e: any) { if (e.message === "Unauthorized") { clearToken(); onLogout(); } }
  }, [onLogout]);

  useEffect(() => { refresh(); const t = setInterval(refresh, 15000); return () => clearInterval(t); }, [refresh]);

  async function refill(id: string) {
    await api(`/admin/kiosks/${id}`, { method: "PATCH", body: { paperLevel: 100, tonerLevel: 100, status: "ONLINE" } });
    refresh();
  }

  const title = NAV.find((n) => n.key === view)!.label;

  return (
    <div className="min-h-screen">
      {/* Icon rail sidebar — floating, icon-only */}
      <aside className="fixed top-4 bottom-4 left-4 w-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center py-4 z-20">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg mb-4" style={{ background: "var(--p)" }}>🖨️</div>
        <nav className="flex-1 flex flex-col items-center gap-2">
          {NAV.map((n) => {
            const active = view === n.key;
            return (
              <button key={n.key} onClick={() => setView(n.key)} title={n.label}
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition ${active ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>
                <Ic name={n.icon} className="w-[20px] h-[20px]" />
                {n.key === "kiosks" && metrics?.lowPaperCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-amber-400 text-amber-950 rounded-full flex items-center justify-center">{metrics.lowPaperCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "var(--p)" }} title={me?.name || "Admin"}>
          {(me?.name?.[0] || "A").toUpperCase()}
        </div>
      </aside>

      {/* Main — offset by rail */}
      <div className="ml-24 mr-4 min-w-0">
        {/* Floating pill navbar */}
        <header className="sticky top-4 z-10 mt-4">
          <div className="bg-white border border-slate-200 rounded-full h-14 px-4 flex items-center justify-between"
            style={{ boxShadow: "0 6px 20px rgba(15,23,42,0.06)" }}>
            <div className="flex items-center gap-3 pl-1">
              <div className="w-8 h-8 rounded-full" style={{ background: "linear-gradient(135deg,#818cf8,#6d4aff)" }} />
              <div className="font-extrabold">Print<span style={{ color: "var(--p)" }}>Hub</span></div>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              {NAV.map((n) => (
                <button key={n.key} onClick={() => setView(n.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${view === n.key ? "text-slate-900" : "text-slate-400 hover:text-slate-700"}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refresh} title="Refresh" className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100">
                <Ic name="refresh" className="w-[18px] h-[18px]" />
              </button>
              <button onClick={() => { clearToken(); onLogout(); }} className="bg-slate-900 text-white text-sm font-semibold rounded-full px-5 py-2.5 hover:bg-slate-800 transition">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="py-6 max-w-6xl">
          <div className="mb-5">
            <h1 className="text-2xl font-extrabold">{title}</h1>
            <p className="text-sm text-slate-400">Central University of Haryana · PrintHub · live, refreshes every 15s</p>
          </div>
          {view === "dashboard" && <Dashboard metrics={metrics} kiosks={kiosks} onRefill={refill} />}
          {view === "orders" && <Orders orders={orders} />}
          {view === "kiosks" && <Kiosks kiosks={kiosks} onRefill={refill} />}
          {view === "users" && <Users users={users} />}
        </main>
      </div>
    </div>
  );
}

/* ---------------- Views ---------------- */
function Metric({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`text-2xl font-extrabold ${accent || "text-slate-900"}`}>{value}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function Dashboard({ metrics, kiosks, onRefill }: { metrics: any; kiosks: any[]; onRefill: (id: string) => void }) {
  return (
    <>
      {metrics?.lowPaperCount > 0 && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="text-sm font-semibold text-amber-800">{metrics.lowPaperCount} kiosk(s) need a paper refill — see Kiosks.</div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Metric label="Total Orders" value={metrics?.totalOrders ?? "—"} />
        <Metric label="Revenue" value={metrics ? rupees(metrics.totalRevenuePaise) : "—"} accent="text-indigo-600" />
        <Metric label="Prints Completed" value={metrics?.completedPrints ?? "—"} accent="text-emerald-600" />
        <Metric label="Pages Printed" value={metrics?.totalPagesPrinted ?? "—"} />
        <Metric label="Students" value={metrics?.totalUsers ?? "—"} />
        <Metric label="Active Kiosks" value={metrics ? `${metrics.activeKiosks} / ${metrics.totalKiosks}` : "—"} />
        <Metric label="Failed Jobs" value={metrics?.failedJobs ?? "—"} accent="text-rose-600" />
        <Metric label="Orders Today" value={metrics?.dailyOrders ?? "—"} />
      </div>
      <h2 className="text-base font-extrabold mb-3">Kiosk Status</h2>
      <KioskGrid kiosks={kiosks} onRefill={onRefill} />
    </>
  );
}

function KioskGrid({ kiosks, onRefill }: { kiosks: any[]; onRefill: (id: string) => void }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {kiosks.map((k) => (
        <div key={k.id} className={`bg-white rounded-xl border p-5 ${k.needsPaper ? "border-amber-400" : "border-slate-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold">{k.name}</div>
              <div className="text-xs text-slate-400">{k.location}</div>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${k.status === "ONLINE" ? "bg-emerald-100 text-emerald-700" : k.status === "BUSY" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{k.status}</span>
          </div>
          <Bar label={`Paper ${k.needsPaper ? "⚠️ refill needed" : ""}`} value={k.paperLevel} />
          <Bar label="Toner" value={k.tonerLevel} />
          <button onClick={() => onRefill(k.id)} className="w-full mt-2 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--p)" }}>Mark Refilled (100%)</button>
        </div>
      ))}
    </div>
  );
}

function Kiosks({ kiosks, onRefill }: { kiosks: any[]; onRefill: (id: string) => void }) {
  return <KioskGrid kiosks={kiosks} onRefill={onRefill} />;
}

function Orders({ orders }: { orders: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>{["Order", "Student", "File", "Pages", "Amount", "Status", "Date"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No orders yet.</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">{o.orderCode}</td>
                <td className="px-4 py-3">{o.user?.name || "-"}<div className="text-xs text-slate-400">{o.user?.phone || ""}</div></td>
                <td className="px-4 py-3 max-w-[160px] truncate">{o.document?.fileName || "-"}</td>
                <td className="px-4 py-3">{o.pagesToPrint} × {o.copies}</td>
                <td className="px-4 py-3 font-semibold">{rupees(o.costPaise)}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-lg ${STATUS_COLORS[o.status] || "bg-slate-100"}`}>{o.status}</span></td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Users({ users }: { users: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>{["Name", "Mobile", "Email", "Roll No", "Role", "Joined"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No students yet.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">{u.name}</td>
                <td className="px-4 py-3">{u.phone || "-"}</td>
                <td className="px-4 py-3">{u.email || "-"}</td>
                <td className="px-4 py-3">{u.rollNumber || "-"}</td>
                <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">{u.role}</span></td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{label}</span><span className="font-bold">{value}%</span></div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: barColor(value) }} />
      </div>
    </div>
  );
}
