"use client";

import type { Settings } from "../types";
import { Row, ChipMultiSelect, NumberInput, Toggle } from "../fields";

const FILE_TYPES = ["PDF", "DOCX", "PPTX", "XLSX", "JPG", "PNG", "TXT"];

export default function PrintRulesTab({ value, onChange }: { value: Settings["print"]; onChange: (p: Partial<Settings["print"]>) => void }) {
  return (
    <div className="space-y-5">
      <Row label="Allowed file types" hint="File formats users are allowed to upload for printing.">
        <ChipMultiSelect options={FILE_TYPES} value={value.allowedFileTypes} onChange={(v) => onChange({ allowedFileTypes: v })} />
      </Row>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Row label="Maximum file size">
          <NumberInput value={value.maxFileSizeMb} onChange={(v) => onChange({ maxFileSizeMb: v })} suffix="MB" />
        </Row>
        <Row label="Allowed page limit" hint="Maximum pages per single order.">
          <NumberInput value={value.maxPageLimit} onChange={(v) => onChange({ maxPageLimit: v })} suffix="pages" />
        </Row>
      </div>
      <div className="space-y-3">
        <Toggle on={value.duplexEnabled} onChange={(v) => onChange({ duplexEnabled: v })} label="Duplex printing" desc="Allow double-sided printing across the network." />
        <Toggle on={value.colorEnabled} onChange={(v) => onChange({ colorEnabled: v })} label="Color printing" desc="Allow color printing where the printer supports it." />
      </div>
    </div>
  );
}
