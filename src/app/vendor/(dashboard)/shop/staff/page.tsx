"use client";

// Staff Management.
//
// There is no staff model. A vendor account is one login — the Vendor row hangs
// off a single User, and every vendor route resolves permissions from that one
// account. There is nothing to list here, and rendering an empty table would
// read as "you have no staff yet" when the truth is "this can't have staff yet".
//
// The console's convention for this is to say what is missing and what it would
// take, rather than to show a lie an owner could act on.
import { LuUserCog, LuUser, LuKeyRound, LuShieldCheck } from "react-icons/lu";
import Link from "next/link";
import { Card, PageHeader } from "@/components/console/primitives";

const NEEDS = [
  {
    icon: LuUser,
    title: "A staff account that isn't the owner",
    body: "Right now one Vendor row points at one User. A second person at the counter would have to share the owner's password, which also means sharing access to the bank account page.",
  },
  {
    icon: LuKeyRound,
    title: "An invite and sign-in flow",
    body: "Somewhere to send an invite, and a way for that person to set their own password without the owner ever seeing it.",
  },
  {
    icon: LuShieldCheck,
    title: "Per-role permissions",
    body: "A counter assistant needs Orders and Printers. They almost certainly should not have Payouts, Bank Accounts or the ability to approve refunds. Every vendor route would need to check the role, not just the shop.",
  },
];

export default function StaffManagementPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <PageHeader
        title="Staff Management"
        subtitle="Extra logins for the people who work at your shop."
      />

      <Card className="p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <LuUserCog size={22} />
          </div>
          <p className="font-bold text-slate-800">Staff accounts don&apos;t exist yet</p>
          <p className="text-sm text-slate-400 mt-1.5">
            Your shop has one login — yours. There is no way to add a second person, so there is
            nothing to show here.
          </p>
          <p className="text-[11px] text-slate-400 mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            Nothing is being hidden — the feature isn&apos;t built.
          </p>
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">What this needs</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Three pieces, and the third is the one that matters.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {NEEDS.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.title} className="flex gap-3 p-4">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-[11px] text-slate-400 px-1">
        In the meantime, if someone else needs to run the counter, keep the owner login to yourself
        and hand over the machine rather than the password — the same account can{" "}
        <Link href="/vendor/finance/payouts" className="font-semibold hover:underline">
          see your payouts
        </Link>{" "}
        and change your bank details.
      </p>
    </div>
  );
}
