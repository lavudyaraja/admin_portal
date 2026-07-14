"use client";

import type { Settings } from "../types";
import { Row, TextInput, SecretInput, NumberInput, Toggle } from "../fields";

export default function PaymentsTab({ value, onChange }: { value: Settings["payments"]; onChange: (p: Partial<Settings["payments"]>) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Row label="Razorpay Key ID" hint="Dashboard → Settings → API Keys.">
          <TextInput value={value.razorpayKeyId} onChange={(v) => onChange({ razorpayKeyId: v })} placeholder="rzp_live_XXXXXXXX" />
        </Row>
        <Row label="Razorpay Key Secret" hint="Stored securely; never shown again after saving.">
          <SecretInput value={value.razorpayKeySecret} isSet={value.razorpayKeySecretSet} onChange={(v) => onChange({ razorpayKeySecret: v })} placeholder="Key secret" />
        </Row>
        <Row label="Refund window (days)" hint="How long after an order a refund can be issued.">
          <NumberInput value={value.refundWindowDays} onChange={(v) => onChange({ refundWindowDays: v })} suffix="days" />
        </Row>
      </div>
      <div className="space-y-3">
        <Toggle on={value.paymentsEnabled} onChange={(v) => onChange({ paymentsEnabled: v })} label="Payments enabled" desc="Turn off to run in free / testing mode." />
        <Toggle on={value.refundsEnabled} onChange={(v) => onChange({ refundsEnabled: v })} label="Allow refunds" desc="Enable automatic refunds for failed prints." />
      </div>
    </div>
  );
}
