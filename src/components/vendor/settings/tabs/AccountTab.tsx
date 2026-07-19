"use client";

import { useEffect, useState } from "react";
import { LuLoaderCircle, LuCircleCheck, LuCircleAlert } from "react-icons/lu";
import { apiFetch, type AdminUser } from "@/lib/vendor/api";
import { Row, TextInput } from "../fields";

function Note({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs font-medium ${ok ? "text-emerald-600" : "text-rose-600"}`}>
      {ok ? <LuCircleCheck size={14} /> : <LuCircleAlert size={14} />} {text}
    </p>
  );
}

export default function AccountTab() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiFetch<{ user: AdminUser }>("/auth/me")
      .then((r) => { setUser(r.user); setName(r.user.name || ""); setEmail(r.user.email || ""); })
      .catch(() => {});
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const r = await apiFetch<{ user: AdminUser }>("/auth/me", { method: "PATCH", body: { name, email } });
      setUser(r.user);
      setProfileMsg({ ok: true, text: "Profile updated." });
    } catch (e: unknown) {
      setProfileMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to update" });
    }
    setSavingProfile(false);
  }

  async function changePassword() {
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: "New passwords do not match." }); return; }
    if (newPw.length < 6) { setPwMsg({ ok: false, text: "New password must be at least 6 characters." }); return; }
    setSavingPw(true);
    try {
      await apiFetch("/auth/change-password", { method: "POST", body: { currentPassword: curPw, newPassword: newPw } });
      setPwMsg({ ok: true, text: "Password changed successfully." });
      setCurPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: unknown) {
      setPwMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to change password" });
    }
    setSavingPw(false);
  }

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section>
        <h4 className="text-sm font-bold text-slate-800 mb-4">Admin Profile</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Row label="Name"><TextInput value={name} onChange={setName} /></Row>
          <Row label="Email"><TextInput type="email" value={email} onChange={setEmail} /></Row>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
          <div><span className="text-slate-400 text-xs">Role</span><p className="font-semibold text-slate-700">{user?.role || "—"}</p></div>
          <div><span className="text-slate-400 text-xs">Account ID</span><p className="font-mono text-xs text-slate-600 break-all">{user?.id || "—"}</p></div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={saveProfile} disabled={savingProfile} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {savingProfile && <LuLoaderCircle size={15} className="animate-spin" />} Save Profile
          </button>
          {profileMsg && <Note ok={profileMsg.ok} text={profileMsg.text} />}
        </div>
      </section>

      {/* Password */}
      <section className="border-t border-slate-100 pt-6">
        <h4 className="text-sm font-bold text-slate-800 mb-4">Change Password</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Row label="Current password"><TextInput type="password" value={curPw} onChange={setCurPw} /></Row>
          <Row label="New password"><TextInput type="password" value={newPw} onChange={setNewPw} /></Row>
          <Row label="Confirm new password"><TextInput type="password" value={confirmPw} onChange={setConfirmPw} /></Row>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={changePassword} disabled={savingPw || !curPw || !newPw} className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40">
            {savingPw && <LuLoaderCircle size={15} className="animate-spin" />} Update Password
          </button>
          {pwMsg && <Note ok={pwMsg.ok} text={pwMsg.text} />}
        </div>
      </section>
    </div>
  );
}
