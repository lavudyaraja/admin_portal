"use client";

import { LuInfo, LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputCls =
  "w-full h-11 px-3.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all";

export function Row({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label} {required && <span className="text-indigo-500">*</span>}
      </label>
      {children}
      {hint && (
        <p className="flex items-start gap-1.5 mt-1.5 text-[11px] leading-relaxed text-slate-400">
          <LuInfo size={13} className="mt-px shrink-0 text-indigo-400" />
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 resize-y transition-all"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function NumberInput({ value, onChange, min = 0, step = 1, prefix, suffix }: { value: number; onChange: (v: number) => void; min?: number; step?: number; prefix?: string; suffix?: string }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{prefix}</span>}
      <input
        type="number"
        min={min}
        step={step}
        className={inputCls + (prefix ? " pl-8" : "") + (suffix ? " pr-14" : "")}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value || "0"))}
      />
      {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{suffix}</span>}
    </div>
  );
}

/** Rupee amount editor backed by a paise value. */
export function RupeeInput({ paise, onChange, step = 0.5 }: { paise: number; onChange: (paise: number) => void; step?: number }) {
  return (
    <NumberInput
      value={(paise ?? 0) / 100}
      onChange={(v) => onChange(Math.round((v || 0) * 100))}
      prefix="₹"
      step={step}
    />
  );
}

/**
 * Shared filter/form select — a thin, consistent wrapper over the shadcn
 * (Base UI) Select so every dropdown in the admin portal looks identical.
 * Keeps the simple `{ value, onChange, options }` API used across the app.
 */
export function Select({
  value,
  onChange,
  options,
  className = "w-full sm:w-56",
  placeholder = "Select…",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <ShadSelect items={options} value={value} onValueChange={(v) => onChange(String(v ?? ""))} disabled={disabled}>
      <SelectTrigger className={cn("h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="rounded-md py-2 text-sm">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadSelect>
  );
}

export function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-slate-300 transition-colors">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-700">{label}</span>
        {desc && <span className="block text-[11px] text-slate-400 mt-0.5">{desc}</span>}
      </span>
      <span className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-indigo-600" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-11 h-11 rounded-xl border border-slate-200 bg-white p-1 cursor-pointer" />
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#4f46e5" />
    </div>
  );
}

export function ChipMultiSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  function toggle(o: string) {
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {o}{active && <LuX size={12} />}
          </button>
        );
      })}
    </div>
  );
}

/** Secret input: shows a "saved" placeholder when a value already exists server-side. */
export function SecretInput({ value, onChange, isSet, placeholder }: { value: string; onChange: (v: string) => void; isSet?: boolean; placeholder?: string }) {
  return (
    <input
      type="password"
      autoComplete="new-password"
      className={inputCls}
      value={value}
      placeholder={isSet ? "•••••••••• (saved — type to replace)" : placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
