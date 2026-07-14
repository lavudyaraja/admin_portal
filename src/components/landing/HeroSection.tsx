"use client";

import Link from "next/link";
import { LuZap, LuChevronRight } from "react-icons/lu";

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export default function HeroSection({ isLoggedIn }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-rose-50/60 via-white to-slate-50">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-200/35 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Tagline */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100/80 mb-6 animate-fade-in">
            <LuZap size={12} className="text-rose-600 animate-pulse" />
            Smart Self-Service Printing Platform
          </span>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-none">
            Transform Your Shop Into A{" "}
            <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 bg-clip-text text-transparent">
              Smart Kiosk
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-base sm:text-lg text-slate-500 leading-relaxed">
            Prinsta empowers college campus shops and printing centers to run self-service printing networks. Zero queues, instant digital payments, and automatic wireless printing via simple QR scans.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-base font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 active:scale-[0.98] transition-all cursor-pointer"
              >
                Go to Dashboard <LuChevronRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-base font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Register Printer Shop <LuChevronRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 text-base font-bold px-8 py-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
                >
                  Login as Admin
                  </Link>
              </>
            )}
          </div>

          {/* Micro stats banner */}
          <div className="mt-12 pt-12 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-xl mx-auto text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">₹2.00</p>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">B&W Printing</p>
            </div>
            <div className="border-x border-slate-100">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">100%</p>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Self Service</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">&lt; 30s</p>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Print Time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
