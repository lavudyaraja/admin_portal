"use client";

// Branches — the physical places this shop operates from.
//
// A branch is what makes the same printer model at two locations unambiguous:
// each machine points at the branch it stands in, so a scanned QR resolves to
// one machine, at one place. That is also why a branch with printers can't be
// deleted — removing it would leave machines belonging nowhere, so the server
// refuses and asks you to move them first.
import { useCallback, useEffect, useState } from "react";
import { LuGitBranch, LuPlus, LuPrinter, LuTrash2, LuPencil, LuSave, LuX } from "react-icons/lu";
import Link from "next/link";
import { apiFetch } from "@/lib/vendor/api";
import { count, dateOnly } from "@/lib/console/format";
import {
  Card, CardHeader, Skeleton, ErrorState, EmptyState, PageHeader,
} from "@/components/console/primitives";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  _count: { printers: number };
}

const inputCls =
  "w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ locations: Branch[] }>("/vendors/me/locations");
      setBranches(res.locations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your branches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setName("");
    setAddress("");
    setFormError("");
  }

  function startEdit(b: Branch) {
    setEditing(b.id);
    setAdding(false);
    setName(b.name);
    setAddress(b.address || "");
    setFormError("");
  }

  function cancel() {
    setAdding(false);
    setEditing(null);
    setFormError("");
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      const body = { name: name.trim(), address: address.trim() || undefined };
      if (editing) {
        await apiFetch(`/vendors/me/locations/${editing}`, { method: "PUT", body });
      } else {
        await apiFetch("/vendors/me/locations", { method: "POST", body });
      }
      cancel();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save that branch.");
    }
    setSaving(false);
  }

  async function remove(b: Branch) {
    // The server refuses to delete a branch that still has printers; asking here
    // first means the common case never becomes a surprise error.
    if (b._count.printers > 0) {
      alert(
        `"${b.name}" still has ${b._count.printers} printer(s). Move them to another branch first.`
      );
      return;
    }
    if (!confirm(`Delete "${b.name}"? This can't be undone.`)) return;

    try {
      await apiFetch(`/vendors/me/locations/${b.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete that branch.");
    }
  }

  const totalPrinters = branches.reduce((s, b) => s + b._count.printers, 0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title="Branches"
        subtitle="The places you operate from. Each printer stands in one of these."
        action={
          !adding && (
            <button
              onClick={startAdd}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <LuPlus size={13} /> Add branch
            </button>
          )
        }
      />

      {(adding || editing) && (
        <Card>
          <CardHeader title={editing ? "Edit branch" : "New branch"} />
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Branch name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MG Road branch"
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Address <span className="font-normal normal-case">(optional)</span>
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, landmark, city"
                className={inputCls}
              />
            </div>

            {formError && <p className="text-xs text-rose-600 font-semibold">{formError}</p>}

            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving || name.trim().length < 2}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LuSave size={14} /> {saving ? "Saving…" : editing ? "Save changes" : "Add branch"}
              </button>
              <button
                onClick={cancel}
                className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <LuX size={14} /> Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : branches.length === 0 ? (
          <EmptyState
            icon={LuGitBranch}
            title="No branches yet"
            hint="Add the place your printers stand in — customers see it when picking a machine."
          />
        ) : (
          <>
            <CardHeader
              title={`${count(branches.length)} branch${branches.length === 1 ? "" : "es"}`}
              subtitle={`${count(totalPrinters)} printer${totalPrinters === 1 ? "" : "s"} across them`}
            />
            <div className="divide-y divide-slate-100">
              {branches.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-4">
                  <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <LuGitBranch size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm truncate">{b.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {b.address || "No address set"} · added {dateOnly(b.createdAt)}
                    </p>
                  </div>

                  <Link
                    href="/vendor/printers"
                    className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 shrink-0 transition-colors"
                  >
                    <LuPrinter size={12} />
                    {b._count.printers} printer{b._count.printers === 1 ? "" : "s"}
                  </Link>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(b)}
                      aria-label={`Edit ${b.name}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <LuPencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(b)}
                      aria-label={`Delete ${b.name}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
