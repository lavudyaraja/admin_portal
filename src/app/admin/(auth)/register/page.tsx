"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { apiFetch, setToken, isOperatorRole, type OperatorUser } from "@/lib/admin/api";
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

function RegisterForm() {
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
    if (loading) return;
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      // In Prinsta backend, register-admin is used for admin registrations
      const data = await apiFetch<{ token: string; user: OperatorUser }>("/auth/register-admin", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          accountType: "admin", // Creates a platform staff profile
        },
      });
      if (!isOperatorRole(data.user?.role)) {
        throw new Error("Registration succeeded, but account is not a platform admin.");
      }
      setToken(data.token);
      router.replace("/admin/dashboard");
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
        const data = await apiFetch<{ token: string; user: OperatorUser }>("/auth/google", {
          method: "POST",
          body: { credential: response.access_token, userInfo },
        });
        if (!isOperatorRole(data.user?.role)) {
          throw new Error("Google login succeeded, but account is not a platform admin.");
        }
        setToken(data.token);
        router.replace("/admin/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google registration failed.");
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google sign-up was cancelled or failed."),
  });

  return (
    <AuthShell
      formTitle="Create Ops Account"
      formSubtitle="Get started with the Prinsta platform control plane."
    >
      {error && <AuthError message={error} />}

      <GoogleButton onClick={() => signUpWithGoogle()} />
      {googleLoading && (
        <p className="text-center text-slate-400 text-xs mt-2 animate-pulse font-medium">Connecting Google account…</p>
      )}

      <OrDivider label="or sign up with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <Field label="Full Name">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={`${inputCls} pl-11`}
            />
          </div>
        </Field>

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
              placeholder="Min 6 characters"
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

        {/* Confirm Password */}
        <Field label="Confirm Password">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPw ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
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

        <SubmitButton label="Create Account" loading={loading} loadingLabel="Creating account…" />
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/admin/login" className="text-ink-sky font-bold hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-center text-slate-400 text-xs mt-4 leading-relaxed">
        By signing up, you agree to our{" "}
        <Link href="/admin/terms" className="underline hover:text-slate-600">Terms of Service</Link>
        {" "}& <Link href="/admin/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-tint-gray" />}>
      <RegisterForm />
    </Suspense>
  );
}
