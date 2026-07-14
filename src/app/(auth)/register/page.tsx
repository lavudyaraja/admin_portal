"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, setToken, type AdminUser } from "@/lib/api";
import {
  AuthShell, AuthError, OrDivider, SubmitButton, GoogleButton, inputCls,
} from "@/components/auth/AuthCard";

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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: AdminUser }>("/auth/register-admin", {
        method: "POST",
        body: { name: name.trim(), email: email.trim().toLowerCase(), password },
      });
      setToken(data.token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  }

  const signUpWithGoogle = useGoogleLogin({
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
        setToken(data.token);
        router.replace("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-up failed.");
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google sign-up was cancelled or failed."),
  });

  return (
    <AuthShell
      formTitle="Create account"
      formSubtitle="Join your Admin Portal — it's free"
    >
      {error && <AuthError message={error} />}

      <GoogleButton onClick={() => signUpWithGoogle()} />
      {googleLoading && (
        <p className="text-center text-stone-400 text-xs mt-2 animate-pulse">Connecting Google account…</p>
      )}

      <OrDivider label="or sign up with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label className="text-stone-600 text-sm font-semibold">Full name</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <Input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name" className={`${inputCls} pl-10`} />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-stone-600 text-sm font-semibold">Email address</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
              </svg>
            </span>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu.in" className={`${inputCls} pl-10`} />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label className="text-stone-600 text-sm font-semibold">Password</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <Input type={showPw ? "text" : "password"} required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 6 chars)" className={`${inputCls} pl-10 pr-11`} />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
              {showPw ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label className="text-stone-600 text-sm font-semibold">Confirm password</Label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <Input type={showPw ? "text" : "password"} required value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password" className={`${inputCls} pl-10 pr-11`} />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
              {showPw ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
        </div>

        <SubmitButton loading={loading} label="Create Account" loadingLabel="Creating account…" />
      </form>

      <p className="text-center text-sm text-stone-500 mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-[#C4622D] font-semibold hover:underline">Sign in</Link>
      </p>

      <p className="text-center text-stone-400 text-xs mt-4">
        By creating an account, you agree to our{" "}
        <a href="#" className="underline hover:text-stone-600">Terms of Service</a>
        {" "}& <a href="#" className="underline hover:text-stone-600">Privacy Policy</a>.
      </p>
    </AuthShell>
  );
}
