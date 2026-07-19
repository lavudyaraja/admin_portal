import type { Metadata } from "next";
import Link from "next/link";
import { LuMail, LuPhone, LuMapPin, LuClock, LuStore, LuHeadphones } from "react-icons/lu";
import PageShell from "@/components/landing/PageShell";

export const metadata: Metadata = {
  title: "Contact Us — Prinsta",
  description: "Reach the Prinsta team about a print, an account, or running a printer.",
};

const CHANNELS = [
  {
    icon: LuMail,
    label: "Email",
    value: "support@prinsta.com",
    href: "mailto:support@prinsta.com",
    hint: "Best for anything that isn't urgent. We reply within one working day.",
  },
  {
    icon: LuPhone,
    label: "Phone",
    value: "+91 98765 43210",
    href: "tel:+919876543210",
    hint: "Mon–Sat, 9:00 AM – 8:00 PM IST.",
  },
  {
    icon: LuMapPin,
    label: "Coverage",
    value: "Available across India",
    hint: "Printers in 50+ cities and growing.",
  },
  {
    icon: LuClock,
    label: "Response time",
    value: "Under 24 hours",
    hint: "Failed prints and payment issues are picked up first.",
  },
];

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="We're here to help"
      title={
        <>
          Contact <span className="text-rose-600">Prinsta</span>
        </>
      }
      intro="Something went wrong with a print, a payment, or your account? Tell us and we'll sort it."
    >
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-5">
            {CHANNELS.map(({ icon: Icon, label, value, href, hint }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200/70 bg-white px-6 py-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50">
                  <Icon size={19} className="text-rose-500" />
                </span>
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">
                  {label}
                </p>
                {href ? (
                  <a
                    href={href}
                    className="mt-1 block text-lg font-black text-slate-900 hover:text-rose-600 transition-colors"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{hint}</p>
              </div>
            ))}
          </div>

          {/* Routes into the two consoles — most "contact" intents are really
              one of these, and sending someone to email first wastes a day. */}
          <div className="mt-6 grid sm:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-rose-50/70 border border-rose-100 px-6 py-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                <LuHeadphones size={19} className="text-rose-500" />
              </span>
              <h2 className="mt-4 text-lg font-black text-slate-900">Already have an account?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Raise a ticket from inside your console and we can see the order alongside it.
              </p>
              <Link
                href="/vendor/support"
                className="mt-4 inline-block rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-5 py-2.5 transition-colors"
              >
                Open a ticket
              </Link>
            </div>

            <div className="rounded-2xl bg-slate-100 border border-slate-200 px-6 py-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                <LuStore size={19} className="text-slate-600" />
              </span>
              <h2 className="mt-4 text-lg font-black text-slate-900">Own a print shop?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                List your printer on Prinsta and earn from walk-in students without staffing the
                counter.
              </p>
              <Link
                href="/vendor/register?role=vendor"
                className="mt-4 inline-block rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-5 py-2.5 transition-colors"
              >
                Register your printer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
