import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";

export default function CTA() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-rose-900 via-rose-950 to-pink-950 text-white relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-72 h-72 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Ready to automate your printing network?
        </h2>
        <p className="text-rose-200/80 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Sign up today, register your printers, paste the generated QR code, and
          let Prinsta handle files, queues and payments automatically.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/vendor/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-950 text-base font-black px-8 py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
          >
            Start free trial <LuChevronRight size={18} />
          </Link>
          <Link
            href="/vendor/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-base font-bold px-8 py-4 rounded-2xl border border-white/20 transition-all active:scale-[0.98]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
