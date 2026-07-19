"use client";

import { useEffect, useState } from "react";
import { LuBanknote, LuShieldCheck, LuTriangleAlert, LuTrash2, LuPencil, LuLock } from "react-icons/lu";
import { apiFetch } from "@/lib/vendor/api";

interface BankAccount {
  accountHolder: string;
  accountLast4: string;
  accountMasked: string;
  ifsc: string;
  bankName: string | null;
  branch: string | null;
  upiId: string | null;
  verified: boolean;
  updatedAt: string;
}

const EMPTY_FORM = {
  accountHolder: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifsc: "",
  bankName: "",
  branch: "",
  upiId: "",
};

export default function BankAccountPage() {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    apiFetch<{ account: BankAccount | null }>("/bank-account")
      .then((r) => {
        setAccount(r.account);
        if (!r.account) setEditing(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.accountNumber !== form.confirmAccountNumber) {
      setError("Account numbers don't match. Please re-enter them.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ account: BankAccount }>("/bank-account", {
        method: "PUT",
        body: {
          accountHolder: form.accountHolder,
          accountNumber: form.accountNumber,
          ifsc: form.ifsc,
          bankName: form.bankName,
          branch: form.branch,
          upiId: form.upiId,
        },
      });
      setAccount(res.account);
      setForm(EMPTY_FORM);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your bank details.");
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Remove this bank account? Payouts will stop until you add another.")) return;
    setRemoving(true);
    try {
      await apiFetch("/bank-account", { method: "DELETE" });
      setAccount(null);
      setForm(EMPTY_FORM);
      setEditing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove the account.");
    }
    setRemoving(false);
  }

  if (loading) {
    return <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">Loading…</div>;
  }

  const input =
    "w-full text-sm border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-orange-400 transition-colors";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-zinc-900">Bank Account</h2>
        <p className="text-zinc-400 text-sm mt-1">
          Where your printing revenue is paid out. Only you can see these details.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
          <LuShieldCheck size={18} className="text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Bank details saved.</p>
        </div>
      )}

      {/* Connected account */}
      {account && !editing && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LuBanknote size={20} />
            </span>
            <div className="flex-1">
              <p className="font-bold text-zinc-900">{account.bankName || "Bank account"}</p>
              <p className="text-xs text-zinc-400">Connected · updated {new Date(account.updatedAt).toLocaleDateString("en-IN")}</p>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                account.verified
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {account.verified ? "Verified" : "Pending verification"}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm">
            {[
              ["Account holder", account.accountHolder],
              ["Account number", account.accountMasked],
              ["IFSC", account.ifsc],
              ["Branch", account.branch || "—"],
              ["UPI ID", account.upiId || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-zinc-400 text-xs">{k}</dt>
                <dd className="font-semibold text-zinc-800 mt-0.5 break-words">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={() => { setEditing(true); setError(""); }}
              className="inline-flex items-center gap-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              <LuPencil size={14} /> Change account
            </button>
            <button
              onClick={remove}
              disabled={removing}
              className="inline-flex items-center gap-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 px-4 py-2.5 rounded-xl transition-colors"
            >
              <LuTrash2 size={14} /> {removing ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      )}

      {/* Add / change form */}
      {editing && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-1">
            <LuBanknote size={18} className="text-orange-500" />
            <h3 className="font-bold text-zinc-900">
              {account ? "Change bank account" : "Connect your bank account"}
            </h3>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3">
              <LuTriangleAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700 font-medium">{error}</p>
            </div>
          )}

          <Field label="Account holder name" required>
            <input
              className={input}
              placeholder="As printed on your passbook"
              value={form.accountHolder}
              onChange={(e) => set("accountHolder", e.target.value)}
              required
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Account number" required>
              <input
                className={input}
                inputMode="numeric"
                autoComplete="off"
                placeholder="6–18 digits"
                value={form.accountNumber}
                onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, ""))}
                required
              />
            </Field>
            <Field label="Confirm account number" required>
              <input
                className={input}
                inputMode="numeric"
                autoComplete="off"
                placeholder="Re-enter to confirm"
                value={form.confirmAccountNumber}
                onChange={(e) => set("confirmAccountNumber", e.target.value.replace(/\D/g, ""))}
                required
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="IFSC code" required>
              <input
                className={`${input} uppercase`}
                placeholder="HDFC0001234"
                value={form.ifsc}
                onChange={(e) => set("ifsc", e.target.value.toUpperCase())}
                required
              />
            </Field>
            <Field label="Bank name">
              <input className={input} placeholder="HDFC Bank" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Branch">
              <input className={input} placeholder="Madhapur" value={form.branch} onChange={(e) => set("branch", e.target.value)} />
            </Field>
            <Field label="UPI ID" hint="Optional — for faster payouts">
              <input className={input} placeholder="name@bank" value={form.upiId} onChange={(e) => set("upiId", e.target.value)} />
            </Field>
          </div>

          <div className="flex items-start gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-3">
            <LuLock size={15} className="text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-500 leading-relaxed">
              Your account number is stored securely and never shown in full again — only the last four digits.
              Double-check the details: payouts go exactly where you enter them.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="text-sm font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-colors"
            >
              {saving ? "Saving…" : account ? "Update account" : "Connect account"}
            </button>
            {account && (
              <button
                type="button"
                onClick={() => { setEditing(false); setForm(EMPTY_FORM); setError(""); }}
                className="text-sm font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-5 py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-zinc-600">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {hint && <span className="block text-[11px] text-zinc-400 mb-1">{hint}</span>}
      <div className={hint ? "" : "mt-1"}>{children}</div>
    </label>
  );
}
