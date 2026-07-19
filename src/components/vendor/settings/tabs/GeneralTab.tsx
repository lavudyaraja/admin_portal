"use client";

import type { Settings } from "../types";
import { Row, TextInput, TextArea, Select } from "../fields";

const TIMEZONES = ["Asia/Kolkata", "UTC", "America/New_York", "Europe/London", "Asia/Dubai", "Asia/Singapore"];
const CURRENCIES = [
  { value: "INR", label: "₹ Indian Rupee (INR)" },
  { value: "USD", label: "$ US Dollar (USD)" },
  { value: "EUR", label: "€ Euro (EUR)" },
];

export default function GeneralTab({ value, onChange }: { value: Settings["general"]; onChange: (p: Partial<Settings["general"]>) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Row label="Platform Name" required>
          <TextInput value={value.platformName} onChange={(v) => onChange({ platformName: v })} placeholder="Prinsta" />
        </Row>
        <Row label="Currency">
          <Select value={value.currency} onChange={(v) => onChange({ currency: v })} options={CURRENCIES} className="w-full" />
        </Row>
        <Row label="Support Email" hint="Shown to users for help & receipts.">
          <TextInput type="email" value={value.supportEmail} onChange={(v) => onChange({ supportEmail: v })} placeholder="support@prinsta.app" />
        </Row>
        <Row label="Support Phone">
          <TextInput value={value.supportPhone} onChange={(v) => onChange({ supportPhone: v })} placeholder="+91 98765 43210" />
        </Row>
        <Row label="Timezone">
          <Select value={value.timezone} onChange={(v) => onChange({ timezone: v })} options={TIMEZONES.map((t) => ({ value: t, label: t }))} className="w-full" />
        </Row>
        <Row label="Company Logo URL" hint="Paste a hosted image URL (no file storage).">
          <TextInput value={value.companyLogoUrl} onChange={(v) => onChange({ companyLogoUrl: v })} placeholder="https://…/logo.png" />
        </Row>
      </div>
      <Row label="Company Address">
        <TextArea value={value.companyAddress} onChange={(v) => onChange({ companyAddress: v })} placeholder="Registered business address" rows={2} />
      </Row>
      {value.companyLogoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.companyLogoUrl} alt="Logo preview" className="h-12 rounded-lg border border-slate-200 bg-white p-1" />
      )}
    </div>
  );
}
