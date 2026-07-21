"use client";

// Account settings — the login itself, as opposed to the shop.
//
// Shop name and contact details live on Shop Profile; this page is about the
// person signing in. The two are genuinely different: changing your shop's
// display name shouldn't touch the email you log in with.
import { useCallback, useEffect, useState } from "react";
import { LuUser, LuSave, LuKeyRound, LuLogOut, LuShieldCheck, LuStore } from "react-icons/lu";
import Link from "next/link";
import { apiFetch, clearToken } from "@/lib/vendor/api";
import { dateOnly } from "@/lib/console/format";
import {
  Card, CardHeader, Skeleton, ErrorState, PageHeader, Chip,
} from "@/components/console/primitives";

interface Me {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
}

const inputCls =
  "w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all";

export default function AccountSettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ user: Me }>("/auth/me");
      setMe(res.user);
      setName(res.user?.name || "");
      setEmail(res.user?.email || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      await apiFetch("/auth/me", {
        method: "PATCH",
        body: { name: name.trim(), email: email.trim() || undefined },
      });
      setProfileSaved(true);
      await load();
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save your details.");
    }
    setSavingProfile(false);
  }

  async function changePassword() {
    // Checked here as well as server-side so the mismatch is caught before the
    // round trip — the server never sees the confirmation field.
    if (newPassword !== confirmPassword) {
      setPasswordError("The two new passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    setPasswordError("");
    setPasswordSaved(false);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not change your password.");
    }
    setSavingPassword(false);
  }

  function signOut() {
    clearToken();
    window.location.href = "/vendor/login";
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <PageHeader title="Account Settings" subtitle="The login you sign in with." />

      {loading ? (
        <>
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </>
      ) : error ? (
        <Card>
          <ErrorState message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader title="Your details" subtitle="Who this account belongs to." />
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 pb-2">
                <span className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 text-sm font-black">
                  {(me?.name || "V").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{me?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Chip
                      label={me?.role === "ADMIN" ? "Platform admin" : "Shop owner"}
                      tint={me?.role === "ADMIN" ? "lavender" : "sky"}
                    />
                    <span className="text-[11px] text-slate-400">
                      since {me?.createdAt ? dateOnly(me.createdAt) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Your name
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls}
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Used for sign-in, password resets and notifications.
                </p>
              </div>

              {me?.phone && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone
                  </label>
                  <input value={me.phone} disabled className={`${inputCls} bg-slate-50 text-slate-500`} />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Contact support to change the number on your account.
                  </p>
                </div>
              )}

              {profileError && <p className="text-xs text-rose-600 font-semibold">{profileError}</p>}

              <div className="flex items-center gap-3">
                <button
                  onClick={saveProfile}
                  disabled={savingProfile || name.trim().length < 2}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LuSave size={14} /> {savingProfile ? "Saving…" : "Save details"}
                </button>
                {profileSaved && <span className="text-xs font-bold text-emerald-600">Saved</span>}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Password"
              subtitle="You'll need your current one to set a new one."
            />
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Current password
                </label>
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className={inputCls}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    New password
                  </label>
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </div>
              </div>

              {passwordError && <p className="text-xs text-rose-600 font-semibold">{passwordError}</p>}

              <div className="flex items-center gap-3">
                <button
                  onClick={changePassword}
                  disabled={savingPassword || !currentPassword || !newPassword}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LuKeyRound size={14} /> {savingPassword ? "Changing…" : "Change password"}
                </button>
                {passwordSaved && (
                  <span className="text-xs font-bold text-emerald-600">Password changed</span>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 p-5">
              <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <LuStore size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">Looking for your shop details?</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shop name, contact and verification are separate from your login.
                </p>
              </div>
              <Link
                href="/vendor/shop"
                className="shrink-0 inline-flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
              >
                Shop Profile
              </Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 p-5">
              <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <LuShieldCheck size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">Sign out</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ends this session on this device only.
                </p>
              </div>
              <button
                onClick={signOut}
                className="shrink-0 inline-flex items-center gap-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <LuLogOut size={13} /> Sign out
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
