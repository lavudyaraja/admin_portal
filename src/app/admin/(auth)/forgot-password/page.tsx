"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/admin/api";
import {
  AuthShell,
  AuthError,
  SubmitButton,
  Field,
  inputCls,
} from "@/components/admin/AuthCard";

/**
 * Step one of the admin password reset: ask for the registered mobile number.
 *
 * Operators sign IN with their email, but the backend keys reset codes by phone
 * (`POST /auth/forgot-password` → looks the user up by phone, mails the code to
 * the address on the account), so this form has to collect the number.
 *
 * The response is deliberately the same whether or not the account exists — we
 * forward to step two either way rather than leaking which numbers are
 * registered. In dev the backend returns the code inline; we hand it straight to
 * the next screen so nobody has to dig through server logs.
 */
export default function OperatorForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ sent: boolean; message: string; devCode?: string }>(
        "/auth/forgot-password",
        { method: "POST", body: { phone: digits } }
      );
      const next = new URLSearchParams({ phone: digits });
      if (data.devCode) next.set("code", data.devCode);
      router.push(`/admin/reset-password?${next.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a reset code.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      formTitle="Reset your password"
      formSubtitle="Enter the mobile number on your admin account and we'll send a 6-digit code to its email address."
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Mobile number">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className={inputCls}
          />
        </Field>

        <SubmitButton loading={loading} label="Send Reset Code" loadingLabel="Sending…" />
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Remembered it?{" "}
        <Link href="/admin/login" className="text-ink-sky font-bold hover:underline">
          Back to Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
