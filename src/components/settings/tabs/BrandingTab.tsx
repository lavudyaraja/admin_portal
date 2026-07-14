"use client";

import type { Settings } from "../types";
import { Row, TextInput, ColorInput, TextArea } from "../fields";

export default function BrandingTab({ value, onChange }: { value: Settings["branding"]; onChange: (p: Partial<Settings["branding"]>) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Row label="App Name">
          <TextInput value={value.appName} onChange={(v) => onChange({ appName: v })} placeholder="Prinsta" />
        </Row>
        <Row label="Logo URL" hint="Paste a hosted image URL (no file storage).">
          <TextInput value={value.logoUrl} onChange={(v) => onChange({ logoUrl: v })} placeholder="https://…/logo.png" />
        </Row>
        <Row label="Primary Color">
          <ColorInput value={value.primaryColor} onChange={(v) => onChange({ primaryColor: v })} />
        </Row>
        <Row label="Secondary Color">
          <ColorInput value={value.secondaryColor} onChange={(v) => onChange({ secondaryColor: v })} />
        </Row>
      </div>
      <Row label="Custom footer text">
        <TextArea value={value.footerText} onChange={(v) => onChange({ footerText: v })} rows={2} />
      </Row>
      {/* Live preview */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: value.primaryColor }}>
          {value.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.logoUrl} alt="" className="h-6" />
          ) : (
            <span className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center text-white text-xs font-black">{(value.appName || "P")[0]}</span>
          )}
          <span className="text-white font-black text-sm">{value.appName || "Prinsta"}</span>
          <span className="ml-auto text-xs font-bold px-2 py-1 rounded-lg text-white" style={{ background: value.secondaryColor }}>Preview</span>
        </div>
        <div className="px-4 py-2 text-[11px] text-slate-400 bg-white">{value.footerText}</div>
      </div>
    </div>
  );
}
