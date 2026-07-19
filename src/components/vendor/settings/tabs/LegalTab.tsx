"use client";

import type { Settings } from "../types";
import { Row, TextArea } from "../fields";

export default function LegalTab({ value, onChange }: { value: Settings["legal"]; onChange: (p: Partial<Settings["legal"]>) => void }) {
  return (
    <div className="space-y-5">
      <Row label="Privacy Policy" hint="Shown in the mobile app and on the web.">
        <TextArea value={value.privacyPolicy} onChange={(v) => onChange({ privacyPolicy: v })} rows={5} placeholder="Enter your privacy policy…" />
      </Row>
      <Row label="Terms & Conditions">
        <TextArea value={value.termsConditions} onChange={(v) => onChange({ termsConditions: v })} rows={5} placeholder="Enter your terms & conditions…" />
      </Row>
      <Row label="Refund Policy">
        <TextArea value={value.refundPolicy} onChange={(v) => onChange({ refundPolicy: v })} rows={5} placeholder="Enter your refund policy…" />
      </Row>
    </div>
  );
}
