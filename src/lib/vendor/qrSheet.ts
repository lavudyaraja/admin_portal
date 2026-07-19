/**
 * Composes a printer's QR code into a labelled sheet.
 *
 * A vendor running several printers downloads one QR per machine and tapes each
 * to the right one. A bare QR image makes that guesswork — five of them look
 * identical on screen and on paper. Drawing the printer's name, its ID and its
 * location onto the sheet makes each one self-identifying, both while filing
 * them and once it is stuck to the machine.
 */

export interface QrSheetInput {
  /** The QR itself, as a data URL. */
  qrCode: string;
  name: string;
  uniquePrinterId: string;
  locationName?: string | null;
  shopName?: string | null;
}

const W = 720;
const H = 960;
const QR = 460;

/** Loads a data-URL image. Rejects rather than resolving a blank canvas. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the QR image."));
    img.src = src;
  });
}

/** Draws `text`, shrinking to fit `maxWidth` and ellipsing only as a last resort. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  { weight, size, min, color }: { weight: string; size: number; min: number; color: string }
) {
  let px = size;
  ctx.fillStyle = color;
  do {
    ctx.font = `${weight} ${px}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    if (ctx.measureText(text).width <= W - 80 || px <= min) break;
    px -= 2;
  } while (px > min);

  let out = text;
  if (ctx.measureText(out).width > W - 80) {
    while (out.length > 1 && ctx.measureText(out + "…").width > W - 80) out = out.slice(0, -1);
    out += "…";
  }
  ctx.fillText(out, W / 2, y);
}

/**
 * Returns a PNG data URL of the labelled sheet.
 *
 * Runs in the browser only — it needs a real canvas.
 */
export async function buildQrSheet(input: QrSheetInput): Promise<string> {
  const img = await loadImage(input.qrCode);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the sheet.");

  // White page — the sheet is meant to be printed.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  // Brand strip, so a sheet found loose is recognisably Prinsta.
  ctx.fillStyle = "#E11D48"; // rose-600
  ctx.fillRect(0, 0, W, 10);

  ctx.fillStyle = "#E11D48";
  ctx.font = '700 26px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillText("Prinsta", W / 2, 76);

  ctx.fillStyle = "#94A3B8"; // slate-400
  ctx.font = '600 18px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillText("Scan to print here", W / 2, 108);

  // The QR, on a bordered plate so the edge is obvious against the paper.
  const qrX = (W - QR) / 2;
  const qrY = 150;
  ctx.strokeStyle = "#E2E8F0"; // slate-200
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX - 14, qrY - 14, QR + 28, QR + 28);
  ctx.drawImage(img, qrX, qrY, QR, QR);

  // Identity block — the part that makes this sheet belong to one machine.
  fitText(ctx, input.name, qrY + QR + 78, { weight: "800", size: 40, min: 22, color: "#0F172A" });

  fitText(ctx, input.uniquePrinterId, qrY + QR + 124, {
    weight: "600",
    size: 28,
    min: 18,
    color: "#E11D48",
  });

  const where = [input.locationName, input.shopName].filter(Boolean).join(" · ");
  if (where) {
    fitText(ctx, where, qrY + QR + 166, { weight: "500", size: 24, min: 16, color: "#64748B" });
  }

  return canvas.toDataURL("image/png");
}
