"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { apiFetch, getToken, setToken, isOperatorRole, type OperatorUser } from "@/lib/admin/api";
import { 
  AuthShell, 
  OrDivider, 
  SubmitButton, 
  GoogleButton, 
  Field, 
  inputCls,
  AuthError
} from "@/components/admin/AuthCard";

const EyeOpen = () => (
  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A10 10 0 0 1 12 4c7 0 11 8 11 8a18.7 18.7 0 0 1-2.16 3.19" />
    <path d="M1 1l22 22" />
  </svg>
);

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("denied") ? "That account isn't a platform admin. Use the vendor console instead." : null
  );

  // A live session means there is nothing to ask for. `denied` is the one
  // exception: it is set right after the layout cleared a non-admin session,
  // and the message explaining why needs to survive.
  useEffect(() => {
    if (!params.get("denied") && getToken()) router.replace("/admin/dashboard");
  }, [router, params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: OperatorUser }>("/auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      if (!isOperatorRole(data.user?.role)) {
        throw new Error("That account isn't a platform admin. Use the vendor console instead.");
      }
      setToken(data.token, remember);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setLoading(false);
    }
  }

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (response) => {
      setError(null);
      setGoogleLoading(true);
      try {
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then((r) => r.json());
        const data = await apiFetch<{ token: string; user: OperatorUser }>("/auth/google", {
          method: "POST",
          body: { credential: response.access_token, userInfo },
        });
        if (!isOperatorRole(data.user?.role)) {
          throw new Error("That account isn't a platform admin. Use the vendor console instead.");
        }
        setToken(data.token, remember);
        router.replace("/admin/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed.");
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  return (
    <AuthShell
      formTitle="Sign in to Ops"
      formSubtitle="Welcome back! Please enter your details below."
    >
      {error && <AuthError message={error} />}

      <GoogleButton onClick={() => loginWithGoogle()} />
      {googleLoading && (
        <p className="text-center text-slate-400 text-xs mt-2 animate-pulse font-medium">Signing in with Google…</p>
      )}

      <OrDivider label="or sign in with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <Field label="Email Address">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
              </svg>
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@prinsta.app"
              className={`${inputCls} pl-11`}
            />
          </div>
        </Field>

        {/* Password */}
        <Field label="Password">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPw ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputCls} pl-11 pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPw ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
        </Field>

        {/* Remember me & Forgot password row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setRemember((v) => !v)}
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                remember ? "bg-ink-sky border-ink-sky" : "border-slate-200 bg-white"
              }`}
            >
              {remember && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </div>
            <span className="text-xs sm:text-sm text-slate-600">Keep me signed in</span>
          </label>
          <Link
            href="/admin/forgot-password"
            className="text-xs sm:text-sm text-ink-sky font-bold hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton label="Sign In" loading={loading} loadingLabel="Signing in…" />
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/admin/register" className="text-ink-sky font-bold hover:underline">
          Create one free
        </Link>
      </p>

      <p className="text-center text-slate-400 text-xs mt-6 leading-relaxed">
        By signing in, you agree to our{" "}
        <Link href="/admin/terms" className="underline hover:text-slate-600">Terms of Service</Link>
        {" "}& <Link href="/admin/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tint-gray" />}>
      <LoginForm />
    </Suspense>
  );
}
