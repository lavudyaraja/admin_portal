import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const metadata: Metadata = {
  title: "Prinsta Ops — Operator Console",
  description: "Platform control plane for the Prinsta self-service printing network.",
};

/**
 * Root of the admin console.
 *
 * The admin console and the vendor console are one Next app (one build, one
 * deployment) but two separate products: different audience, different sidebar,
 * different token key. Everything admin lives under this segment, so the two
 * only share the html shell and the Tailwind theme.
 *
 * `admin-scope` carries the console's base colours and thin scrollbars —
 * scoped here rather than on `body` so the marketing pages keep their own look.
 */
export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-scope min-h-screen bg-white text-slate-800 antialiased">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>
    </div>
  );
}
