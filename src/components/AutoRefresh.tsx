"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AUTO_REFRESH_INTERVAL_MS } from "@/lib/constants";

/**
 * Silently re-runs the current route's server components on an interval, so
 * data that changes server-side — another renewal, a purge, or a member's
 * status flipping to "expired" as the clock ticks past midnight — shows up
 * without a manual reload.
 *
 * Pauses while the tab is hidden (no point polling a backgrounded tab) and
 * refreshes immediately when it becomes visible again to catch up.
 */
export function AutoRefresh({
  intervalMs = AUTO_REFRESH_INTERVAL_MS,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function start() {
      if (timerRef.current) return;
      timerRef.current = setInterval(() => router.refresh(), intervalMs);
    }
    function stop() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    function handleVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        router.refresh();
        start();
      }
    }

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, intervalMs]);

  return null;
}
