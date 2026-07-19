"use client";

import type { Settings } from "../types";
import { Row, RupeeInput, NumberInput } from "../fields";

export default function PricingTab({ value, onChange }: { value: Settings["pricing"]; onChange: (p: Partial<Settings["pricing"]>) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Row label="Black & White — price per page" required>
          <RupeeInput paise={value.bwPricePaise} onChange={(p) => onChange({ bwPricePaise: p })} />
        </Row>
        <Row label="Color — price per page" required>
          <RupeeInput paise={value.colorPricePaise} onChange={(p) => onChange({ colorPricePaise: p })} />
        </Row>
        <Row label="Minimum order amount" hint="Orders below this are not allowed. 0 = no minimum.">
          <RupeeInput paise={value.minOrderPaise} onChange={(p) => onChange({ minOrderPaise: p })} />
        </Row>
        <Row label="GST percentage" hint="Applied on the print subtotal.">
          <NumberInput value={value.gstPercent} onChange={(v) => onChange({ gstPercent: v })} suffix="%" step={0.5} />
        </Row>
        <Row label="Extra charges (optional)" hint="Flat handling/service fee added per order.">
          <RupeeInput paise={value.extraChargesPaise} onChange={(p) => onChange({ extraChargesPaise: p })} />
        </Row>
      </div>
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500">
        These are the default network prices. Individual printers can override B&W / color rates on their own detail page.
      </div>
    </div>
  );
}
