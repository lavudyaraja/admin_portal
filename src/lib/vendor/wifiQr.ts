/**
 * Builds the Wi-Fi QR payload a phone scans to join a network.
 *
 * Format (the de-facto standard every phone camera understands):
 *   WIFI:S:<ssid>;T:<WPA|nopass>;P:<password>;H:<true|false>;;
 *
 * The Prinsta app scans exactly this to connect to a printer's Wi-Fi Direct
 * network, so the student never types a password.
 */
export interface WifiQrInput {
  ssid: string;
  password?: string;
  /** WPA/WPA2 by default; pass "nopass" for an open network. */
  security?: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

/** Special characters carry meaning in the payload and must be escaped. */
function esc(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiQrPayload({ ssid, password = "", security = "WPA", hidden = false }: WifiQrInput): string {
  const type = password ? security : "nopass";
  const parts = [`S:${esc(ssid)}`, `T:${type}`];
  if (type !== "nopass") parts.push(`P:${esc(password)}`);
  if (hidden) parts.push("H:true");
  return `WIFI:${parts.join(";")};;`;
}
