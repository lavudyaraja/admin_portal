"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, setToken, isOperatorRole, type OperatorUser } from "@/lib/admin/api";
import {
  AuthShell,
  AuthError,
  SubmitButton,
  Field,
  inputCls,
} from "@/components/admin/AuthCard";

const EyeOpen = () => (
  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18.7 18.7 0 0 1-2.16 3.19" />
    <path d="M1 1l22 22" />
  </svg>
);

/**
 * Step two of the admin password reset: the code plus a new password.
 *
 * `phone` arrives in the query string from the forgot-password screen. In dev
 * the code rides along too, pre-filled — the backend only returns it when no
 * mail provider is configured.
 *
 * `POST /auth/reset-password` signs the user straight in, so the role guard
 * matters here exactly as it does on the login screen: a vendor resetting their
 * password must not land in the platform console.
 */
function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = (params.get("phone") || "").replace(/\D/g, "");

  const [code, setCode] = useState(params.get("code") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: OperatorUser }>("/auth/reset-password", {
        method: "POST",
        body: { phone, code: code.trim(), password },
      });
      if (!isOperatorRole(data.user?.role)) {
        throw new Error("That account isn't a platform admin. Use the vendor console instead.");
      }
      setToken(data.token);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
      setLoading(false);
    }
  }

  // Reached directly, with no number to reset against — send them back to step one.
  if (!phone) {
    return (
      <AuthShell
        formTitle="Start again"
        formSubtitle="We need the mobile number on your account before we can reset the password."
      >
        <Link
          href="/admin/forgot-password"
          className="w-full h-11 rounded-xl bg-ink-sky hover:bg-sky-600 text-white text-sm font-bold flex items-center justify-center transition-colors"
        >
          Request a Reset Code
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      formTitle="Set a new password"
      formSubtitle={`Enter the 6-digit code sent for +91 ${phone} and choose a new password.`}
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Reset code">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className={`${inputCls} tracking-[0.3em] font-semibold`}
          />
        </Field>

        <Field label="New password">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPw ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
        </Field>

        <Field label="Confirm password">
          <input
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className={inputCls}
          />
        </Field>

        <SubmitButton loading={loading} label="Reset Password" loadingLabel="Resetting…" />
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Didn&apos;t get a code?{" "}
        <Link href="/admin/forgot-password" className="text-ink-sky font-bold hover:underline">
          Send it again
        </Link>
      </p>
    </AuthShell>
  );
}

export default function OperatorResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tint-gray" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
