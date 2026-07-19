"use client";

import Link from "next/link";
import { LuChevronLeft, LuFileText } from "react-icons/lu";

export default function TermsPage() {
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
            <LuFileText size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Operator Terms of Service</h1>
            <p className="text-xs text-slate-400 font-medium">Last updated: July 2026</p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="space-y-6 text-sm text-slate-650 leading-relaxed border-t border-slate-100 pt-6">
          <section>
            <h2 className="font-bold text-slate-800 mb-2">1. Acceptable Use of Control Plane</h2>
            <p>
              Operator profiles are issued exclusively for platform management, queue mediation, and network health auditing. You agree not to bypass role restrictions, manipulate printer registry settings without vendor consent, or query raw tables outside standard console modules.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">2. Confidentiality of Vendor & User Data</h2>
            <p>
              Prinsta Ops provides access to transactional ledger models, printer hardware details, and user order logs. You must preserve strict confidentiality over all student credentials, transaction values, and documents processed by cloud print workers.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">3. Service Integrity and Queue Audits</h2>
            <p>
              You agree to monitor printer statuses, paper levels, and toner alerts honestly. Job cancellations and Points refund triggers must only be activated for verified hardware errors, and never to alter running balances or block legitimate user pipelines.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">4. Access Suspension</h2>
            <p>
              We reserve the right to suspend or terminate admin profiles immediately in the event of credential sharing, unauthorized API calls to the gateway, or any platform manipulation that violates security protocols.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-800 mb-2">5. Updates and Governance</h2>
            <p>
              These Terms of Service are governed by Prinsta platform policies. Changes are announced on the central platform channel, and continued use of the admin control panel constitutes acceptance of the updated rules.
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
