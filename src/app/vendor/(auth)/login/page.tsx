"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, getToken, setToken, isConsoleRole, type AdminUser } from "@/lib/vendor/api";
import {
  AuthShell, AuthError, OrDivider, SubmitButton, GoogleButton, inputCls,
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A live session means there is nothing to ask for — go straight to the
  // console. Sessions outlive the browser window, so this is the usual path
  // back in for a returning vendor.
  useEffect(() => {
    if (getToken()) router.replace("/vendor/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: AdminUser }>("/auth/login", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), password },
      });
      if (!isConsoleRole(data.user.role)) throw new Error("Access denied. Admin account required.");
      setToken(data.token, remember);
      router.replace("/vendor/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
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
        const data = await apiFetch<{ token: string; user: AdminUser }>("/auth/google", {
          method: "POST",
          body: { credential: response.access_token, userInfo },
        });
        setToken(data.token, remember);
        router.replace("/vendor/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed.");
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  return (
    <AuthShell
      formTitle="Welcome back"
      formSubtitle={<>Sign <span className="font-semibold text-stone-700">in</span> to your Admin Portal</>}
    >
      {error && <AuthError message={error} />}

      <GoogleButton onClick={() => loginWithGoogle()} />
      {googleLoading && (
        <p className="text-center text-stone-400 text-xs mt-2 animate-pulse">Signing in with Google…</p>
      )}

      <OrDivider label="or sign in with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-stone-600 text-sm font-semibold">Email address</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
              </svg>
            </span>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu.in"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-stone-600 text-sm font-semibold">Password</Label>
            <Link href="/vendor/forgot-password" className="text-sm text-ink-peach font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <Input
              type={showPw ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${inputCls} pl-10 pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
            >
              {showPw ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setRemember((v) => !v)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${remember ? "bg-ink-peach border-ink-peach" : "border-slate-200 bg-white"}`}
          >
            {remember && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </div>
          <span className="text-sm text-stone-600">Keep me signed in for 30 days</span>
        </label>

        <SubmitButton loading={loading} label="Sign In" loadingLabel="Signing in…" />
      </form>

      <p className="text-center text-sm text-stone-500 mt-5">
        Don&apos;t have an account?{" "}
        <Link href="/vendor/register" className="text-ink-peach font-semibold hover:underline">
          Create one free
        </Link>
      </p>

      <p className="text-center text-stone-400 text-xs mt-6">
        By signing in, you agree to our{" "}
        <a href="#" className="underline hover:text-stone-600">Terms of Service</a>
        {" "}& <a href="#" className="underline hover:text-stone-600">Privacy Policy</a>.
      </p>
    </AuthShell>
  );
}
