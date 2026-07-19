"use client";

// The stat strip that sits under a list page's header.
//
// Exists so Users, Orders, Printers and Transactions can't drift apart in
// spacing or skeleton behaviour — each page supplies its own tiles, this owns
// the grid and the loading state.
import type { ReactNode } from "react";
import { Skeleton } from "@/components/console/primitives";

export function StatRow({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] rounded-2xl" />
          ))
        : children}
    </section>
  );
}
