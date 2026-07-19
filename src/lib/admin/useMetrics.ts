"use client";

// Platform metrics, shared by every admin list page that shows a stat row.
//
// Cached for the session: the same figures back Users, Orders, Printers and
// Transactions, and refetching them on each navigation is four identical
// round trips for numbers that barely move.
import { useEffect, useState } from "react";
import { apiFetch, type Metrics } from "./api";

let cached: Metrics | null = null;
let inFlight: Promise<Metrics> | null = null;

export function useMetrics(): Metrics | null {
  const [metrics, setMetrics] = useState<Metrics | null>(cached);

  useEffect(() => {
    if (cached) return;
    let alive = true;

    // One request even when several components mount together.
    inFlight ??= apiFetch<Metrics>("/admin/metrics");

    inFlight
      .then((m) => {
        cached = m;
        if (alive) setMetrics(m);
      })
      .catch(() => {
        // Leave the stat row in its loading state rather than showing zeros,
        // which would read as real data.
        inFlight = null;
      });

    return () => {
      alive = false;
    };
  }, []);

  return metrics;
}
