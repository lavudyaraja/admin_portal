"use client";

import { useSyncExternalStore } from "react";
import {
  activeConsolesSnapshot,
  subscribeToSessions,
  NO_SESSIONS,
  DASHBOARD_PATH,
  type ConsoleKind,
} from "@/lib/session";

/**
 * Which consoles this browser is signed in to.
 *
 * Sessions live in localStorage, which no React state owns, so this subscribes
 * to the store rather than copying it into state on mount. Two consequences
 * worth knowing:
 *
 *  - The server snapshot is empty, so the first paint is always the signed-out
 *    UI. Anything built on this must degrade to that rather than flicker.
 *  - Signing out — here or in another tab — updates every subscriber, so the nav
 *    cannot go on offering a dashboard for a session that is gone.
 */
export function useActiveConsoles(): ConsoleKind[] {
  return useSyncExternalStore(subscribeToSessions, activeConsolesSnapshot, () => NO_SESSIONS);
}

/** The console to send a signed-in reader to, or null. Vendor wins a tie — the
 *  landing page is written for them. */
export function useDashboardHref(): string | null {
  const [first] = useActiveConsoles();
  return first ? DASHBOARD_PATH[first] : null;
}
