"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import { getToken } from "@/lib/api";
import {
  LuPrinter,
  LuQrCode,
  LuZap,
  LuClock,
  LuShieldCheck,
  LuTrendingUp,
  LuWallet,
  LuCheck,
  LuPlay,
  LuUsers,
  LuChevronRight,
} from "react-icons/lu";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-rose-500 selection:text-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection isLoggedIn={isLoggedIn} />

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Feature-Rich Printing Ecosystem
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Everything you need to automate printing and manage revenue seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-slate-50 border border-slate-100 hover:border-rose-100 hover:bg-white rounded-3xl p-6 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-all duration-300 mb-6">
                <LuQrCode size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">QR Scan &amp; Print</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Students scan the unique QR code on the printer, upload documents, pay digitally, and the machine starts printing immediately.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-slate-50 border border-slate-100 hover:border-rose-100 hover:bg-white rounded-3xl p-6 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-all duration-300 mb-6">
                <LuTrendingUp size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Admin Dashboard</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Track live active printers, paper &amp; toner levels, daily sales revenue, transaction history, and support tickets in a unified dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-slate-50 border border-slate-100 hover:border-rose-100 hover:bg-white rounded-3xl p-6 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-all duration-300 mb-6">
                <LuWallet size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Instant Payments</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Integrated UPI, card payments, and internal student wallets. Payments are processed securely and credited to operators directly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-slate-50 border border-slate-100 hover:border-rose-100 hover:bg-white rounded-3xl p-6 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-all duration-300 mb-6">
                <LuClock size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Real-Time Queue</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Monitor jobs in the print queue. Print status updates dynamically from "Pending Payment" to "Printing" and "Completed".
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-slate-50 border border-slate-100 hover:border-rose-100 hover:bg-white rounded-3xl p-6 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-all duration-300 mb-6">
                <LuShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Secure File Storage</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Documents are uploaded to secure S3-compatible cloud storage, encrypted, and automatically deleted immediately after printing for privacy.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-slate-50 border border-slate-100 hover:border-rose-100 hover:bg-white rounded-3xl p-6 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-all duration-300 mb-6">
                <LuUsers size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">User Management</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Roles-based access control. Separate layouts for administrators, shop operators, and students to ensure smooth business operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              How Prinsta Works
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Simple 3-step processes for students and operators alike.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Student Flow */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-950 mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                For Students
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">1</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Scan QR Code</p>
                    <p className="text-slate-500 text-xs mt-1">Scan the QR code pasted on the printer using your mobile app or camera to open the document uploader.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">2</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Upload &amp; Configure</p>
                    <p className="text-slate-500 text-xs mt-1">Select the PDF or image, set print config (copies, B&amp;W/Color, single/double sided) and see instant cost calculation.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">3</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Pay &amp; Print</p>
                    <p className="text-slate-500 text-xs mt-1">Pay via UPI or Wallet. The backend pushes the print task to the wireless printer queue immediately.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Operator Flow */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-950 mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                For Printer Shop Owners
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center font-bold text-sm shrink-0">1</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Register Printer</p>
                    <p className="text-slate-500 text-xs mt-1">Add your network printer IP, select brand/model, set print rates per page and generate your custom QR code.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center font-bold text-sm shrink-0">2</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Paste QR Code</p>
                    <p className="text-slate-500 text-xs mt-1">Download and print the generated QR banner, and stick it onto the front of your self-service printer.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="w-7 h-7 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center font-bold text-sm shrink-0">3</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Collect Revenue</p>
                    <p className="text-slate-500 text-xs mt-1">Let students print by themselves. Track paper/toner and withdraw your earned revenues directly into your bank.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Simple &amp; Transparent Rates
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Setup self-service stations without hidden operational charges.
            </p>
          </div>

          <div className="max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-8 relative shadow-sm">
            <span className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
              Standard Rates
            </span>
            <h3 className="text-xl font-bold text-slate-900">Pre-Configured Rates</h3>
            <p className="text-slate-400 text-xs mt-1">Default network pricing configurations</p>
            <div className="my-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-600 font-medium text-sm">Black &amp; White Print</span>
                <span className="text-slate-900 font-black text-lg">₹2.00 <span className="text-xs font-normal text-slate-400">/ page</span></span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-600 font-medium text-sm">Color Print</span>
                <span className="text-slate-900 font-black text-lg">₹10.00 <span className="text-xs font-normal text-slate-400">/ page</span></span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-slate-600 font-medium text-sm">Platform Commission</span>
                <span className="text-slate-900 font-black text-base text-emerald-600">0% <span className="text-xs font-normal text-slate-400">during beta</span></span>
              </div>
            </div>

            <Link
              href="/register"
              className="w-full inline-flex items-center justify-center bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm py-3 rounded-2xl transition-colors active:scale-[0.98]"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-rose-900 to-pink-950 text-white relative overflow-hidden">
        {/* Glow Background blobs */}
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Ready to Automate Your Printing Network?
          </h2>
          <p className="text-rose-200/80 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Sign up today, register your network printers, paste the generated QR code, and watch the platform handle files, queues, and payments automatically.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-950 text-base font-black px-8 py-3.5 rounded-2xl shadow-lg transition-all active:scale-[0.98]"
            >
              Start Free Trial <LuChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                P
              </div>
              <span className="text-white font-black text-base tracking-tight">Prinsta</span>
            </div>
            <p className="text-xs text-slate-500">© 2026 Prinsta. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/support" className="hover:text-white transition-colors">Help Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
