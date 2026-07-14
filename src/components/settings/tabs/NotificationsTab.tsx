"use client";

import type { Settings } from "../types";
import { Toggle } from "../fields";

export default function NotificationsTab({ value, onChange }: { value: Settings["notifications"]; onChange: (p: Partial<Settings["notifications"]>) => void }) {
  return (
    <div className="space-y-3">
      <Toggle on={value.emailNotifications} onChange={(v) => onChange({ emailNotifications: v })} label="Email notifications" desc="Master switch for all outgoing emails." />
      <Toggle on={value.orderCompletion} onChange={(v) => onChange({ orderCompletion: v })} label="Order completion notifications" desc="Email the user when their print job is done." />
      <Toggle on={value.failedPaymentAlerts} onChange={(v) => onChange({ failedPaymentAlerts: v })} label="Failed payment alerts" desc="Notify users when a payment fails." />
      <Toggle on={value.adminNotifications} onChange={(v) => onChange({ adminNotifications: v })} label="Admin notifications" desc="Alert admins about printer errors and new tickets." />
    </div>
  );
}
