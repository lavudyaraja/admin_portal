"use client";

/**
 * Revenue over time — a single measure against a single axis, so it's one
 * series in one hue with no legend (the card title names it). Hand-built SVG:
 * the console pulls in no charting library.
 */
import { useMemo, useState } from "react";
import { SEQUENTIAL_HEX } from "@/lib/console/theme";
import { inr, axisDate } from "@/lib/console/format";
/**
 * One day on the revenue axis.
 *
 * Declared here rather than imported from a portal's API client — the chart is
 * shared, and both consoles' `/admin/revenue` responses have this shape.
 */
export interface RevenuePoint {
  date: string;
  revenuePaise: number;
  orders: number;
  pages: number;
  bwOrders: number;
  colorOrders: number;
}

const W = 720;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 26, left: 48 };

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const plot = useMemo(() => {
    const iw = W - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const max = Math.max(1, ...data.map((d) => d.revenuePaise));
    // Round the ceiling up to a clean step so the axis labels are readable.
    const step = Math.pow(10, Math.floor(Math.log10(max)));
    const ceil = Math.ceil(max / step) * step;

    const x = (i: number) => PAD.left + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = (v: number) => PAD.top + ih - (v / ceil) * ih;

    const points = data.map((d, i) => ({ x: x(i), y: y(d.revenuePaise), d }));
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area =
      points.length > 0
        ? `${line} L${points[points.length - 1].x.toFixed(1)},${(PAD.top + ih).toFixed(1)} L${points[0].x.toFixed(1)},${(PAD.top + ih).toFixed(1)} Z`
        : "";

    // Four horizontal gridlines, including the baseline.
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: ceil * f, y: y(ceil * f) }));

    return { points, line, area, ticks, iw, ih };
  }, [data]);

  if (!data.length) {
    return <p className="text-sm text-slate-400 px-5 py-10 text-center">No revenue in this period.</p>;
  }

  const active = hover !== null ? plot.points[hover] : null;

  // Label only the ends and the peak — never a number on every point.
  const peakIdx = data.reduce((best, d, i) => (d.revenuePaise > data[best].revenuePaise ? i : best), 0);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[520px] h-auto block"
        role="img"
        aria-label="Daily revenue over the selected period"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SEQUENTIAL_HEX} stopOpacity="0.16" />
            <stop offset="100%" stopColor={SEQUENTIAL_HEX} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Recessive gridlines + value axis */}
        {plot.ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={i === 0 ? undefined : "3 3"}
            />
            <text x={PAD.left - 8} y={t.y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
              {inr(t.v)}
            </text>
          </g>
        ))}

        <path d={plot.area} fill="url(#revFill)" />
        <path d={plot.line} fill="none" stroke={SEQUENTIAL_HEX} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Peak marker — a 2px surface ring keeps it legible over the fill. */}
        <circle cx={plot.points[peakIdx].x} cy={plot.points[peakIdx].y} r="4.5" fill={SEQUENTIAL_HEX} stroke="#fff" strokeWidth="2" />

        {/* Date axis — first, middle, last only, so labels never collide. */}
        {[0, Math.floor(data.length / 2), data.length - 1]
          .filter((i, k, arr) => arr.indexOf(i) === k)
          .map((i) => (
            <text
              key={i}
              x={plot.points[i].x}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              fontSize="10"
              fill="#94a3b8"
              fontWeight="600"
            >
              {axisDate(data[i].date)}
            </text>
          ))}

        {/* Crosshair */}
        {active && (
          <>
            <line x1={active.x} x2={active.x} y1={PAD.top} y2={PAD.top + plot.ih} stroke="#cbd5e1" strokeWidth="1" />
            <circle cx={active.x} cy={active.y} r="4.5" fill={SEQUENTIAL_HEX} stroke="#fff" strokeWidth="2" />
          </>
        )}

        {/* Invisible hit bands — hit targets are far wider than the marks. */}
        {plot.points.map((p, i) => (
          <rect
            key={i}
            x={p.x - plot.iw / Math.max(1, data.length - 1) / 2}
            y={PAD.top}
            width={plot.iw / Math.max(1, data.length - 1)}
            height={plot.ih}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {active && (
        <div
          className="absolute pointer-events-none bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg z-10 min-w-[132px]"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: 6,
            transform: active.x > W * 0.6 ? "translateX(-108%)" : "translateX(8%)",
          }}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{axisDate(active.d.date)}</p>
          <p className="text-sm font-black text-slate-900 tabular-nums mt-0.5">{inr(active.d.revenuePaise)}</p>
          <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
            {active.d.orders} orders · {active.d.pages} pages
          </p>
        </div>
      )}
    </div>
  );
}
