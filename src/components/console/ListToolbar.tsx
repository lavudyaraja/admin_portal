"use client";

import { LuSearch, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { PAGE_SIZE } from "@/lib/console/useList";
import { count } from "@/lib/console/format";

/** Search box + one filter dropdown, in a single row above the table. */
export function ListToolbar({
  search,
  setSearch,
  placeholder,
  filter,
  setFilter,
  filterLabel,
  options,
}: {
  search?: string;
  setSearch?: (s: string) => void;
  placeholder?: string;
  filter?: string;
  setFilter?: (f: string) => void;
  filterLabel?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {setSearch && (
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <LuSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder || "Search…"}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      )}

      {options && setFilter && (
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label={filterLabel || "Filter"}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:border-slate-400 transition-colors cursor-pointer"
        >
          <option value="">All {filterLabel || "statuses"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function Pagination({
  page,
  setPage,
  total,
}: {
  page: number;
  setPage: (p: number) => void;
  total: number;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;

  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-400 tabular-nums">
        {count(from)}–{count(to)} of {count(total)}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <LuChevronLeft size={16} />
        </button>
        <span className="text-xs font-bold text-slate-600 tabular-nums px-2">
          {page + 1} / {pages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page + 1 >= pages}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <LuChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
