"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, setToken, isConsoleRole, type AdminUser } from "@/lib/vendor/api";
import {
  AuthShell, AuthError, AuthInfo, SubmitButton, inputCls,
} from "@/components/vendor/AuthCard";

const EyeOpen = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18.7 18.7 0 0 1-2.16 3.19" />
    <path d="M1 1l22 22" />
  </svg>
);

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (phone.replace(/\D/g, "").length !== 10) { setError("Enter a valid 10-digit mobile number"); return; }
    setLoading(true);
    try {
      const data = await apiFetch<{ sent: boolean; message: string; devCode?: string }>(
        "/auth/forgot-password",
        { method: "POST", body: { phone: phone.replace(/\D/g, "") } }
      );
      setInfo(data.devCode ? `Dev mode — reset code: ${data.devCode}` : data.message || "Code sent.");
      if (data.devCode) setCode(data.devCode);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: AdminUser }>(
        "/auth/reset-password",
        { method: "POST", body: { phone: phone.replace(/\D/g, ""), code: code.trim(), password } }
      );
      if (!isConsoleRole(data.user.role)) throw new Error("Access denied. Admin account required.");
      setToken(data.token);
      router.replace("/vendor/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      formTitle={step === "request" ? "Reset password" : "Set new password"}
      formSubtitle={
        step === "request"
          ? "Enter your registered mobile number to receive a reset code"
          : "Enter the 6-digit code and your new password"
      }
    >
      {error && <AuthError message={error} />}
      {info && <AuthInfo message={info} />}

      {step === "request" ? (
        <form onSubmit={requestCode} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-stone-600 text-sm font-semibold">Mobile number</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.25 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.16 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16l.92.92z" />
                </svg>
              </span>
              <Input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number" className={`${inputCls} pl-10`} />
            </div>
          </div>
          <SubmitButton loading={loading} label="Send Reset Code" loadingLabel="Sending…" />
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-stone-600 text-sm font-semibold">Reset code</Label>
            <Input type="text" required value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code" className={inputCls} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-stone-600 text-sm font-semibold">New password</Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a new password" className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                {showPw ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-stone-600 text-sm font-semibold">Confirm password</Label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password" className={`${inputCls} pr-11`} />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                {showPw ? <EyeOff /> : <EyeOpen />}
              </button>
            </div>
          </div>

          <SubmitButton loading={loading} label="Reset Password" loadingLabel="Resetting…" />
        </form>
      )}

      <p className="text-center text-sm text-stone-500 mt-5">
        Remembered it?{" "}
        <Link href="/vendor/login" className="text-ink-peach font-semibold hover:underline">Back to Sign In</Link>
      </p>
    </AuthShell>
  );
}
