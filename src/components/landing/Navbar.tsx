"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out border border-rose-200/60 bg-rose-50/75 backdrop-blur-md rounded-2xl
        ${scrolled
          ? "top-2 w-[calc(100%-2rem)] max-w-6xl"
          : "top-6 w-[calc(100%-4rem)] max-w-3xl"
        }`}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "h-14" : "h-16"}`}>
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-black text-sm shrink-0">
              P
            </div>
            <span className="text-slate-950 font-black text-lg tracking-tight">Prinsta</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors">
              Pricing
            </Link>
            <Link href="#support" className="text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors">
              Support
            </Link>
          </div>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-700 hover:text-rose-600 px-4 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 active:scale-[0.98]"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <LuX size={22} /> : <LuMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-rose-200/50 bg-rose-50/80 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg rounded-b-2xl">
          <Link
            href="#features"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#support"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors"
          >
            Support
          </Link>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-center px-4 py-2.5 text-base font-bold text-slate-700 hover:bg-rose-50/50 hover:text-rose-600 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="text-center bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-base font-bold rounded-xl transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/20"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
