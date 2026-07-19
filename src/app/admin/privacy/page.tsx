"use client";

import Link from "next/link";
import { LuChevronLeft, LuShield } from "react-icons/lu";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-tint-gray flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-10 shadow-sm">
        
        {/* Back Link */}
        <Link 
          href="/admin/login" 
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink-sky hover:underline mb-8"
        >
          <LuChevronLeft size={16} />
          Back to Login
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-tint-sky flex items-center justify-center text-ink-sky">
            <LuShield size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Operator Privacy Policy</h1>
            <p className="text-xs text-slate-400 font-medium">Last updated: July 2026</p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="space-y-6 text-sm text-slate-650 leading-relaxed border-t border-slate-100 pt-6">
          <section>
            <h2 className="font-bold text-slate-800 mb-2">1. Information We Collect</h2>
            <p>
              As a platform admin on the Prinsta network, we collect basic registration data required to maintain secure access control. This includes your full name, work email address, role credentials, and platform action logs.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">2. How We Use Operator Data</h2>
            <p>
              Your data is strictly used to maintain the security, auditability, and operations of the Prinsta network. Action logs record printer registrations, settings modifications, queue management actions, and support resolutions to ensure accountability.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">3. Data Sharing & Security</h2>
            <p>
              Operator profiles and internal audit logs are never shared with third parties or external advertisers. All connection data is encrypted in transit and hashed at rest. Passwords are secured using industrial bcrypt algorithms.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">4. Access Controls & Retention</h2>
            <p>
              Platform credentials and logs are stored securely in our Neon database branch. Access is restricted using secure role-based JSON Web Tokens (JWT). Action logs are preserved for standard security auditing cycles and purged thereafter.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">5. Updates and Contact</h2>
            <p>
              We may revise this privacy policy periodically to reflect platform security additions. For questions regarding account controls or data extraction requests, please raise a ticket via the internal platform support panel.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          Prinsta Ops Control Plane · Restricted Internal Use Only
        </div>

      </div>
    </div>
  );
}
