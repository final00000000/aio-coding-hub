// Usage:
// - Provides a reactive Unix timestamp (seconds) that ticks every second.
// - Automatically starts/stops the interval based on the `enabled` flag.
// - Eliminates duplication of the nowUnix + setInterval pattern across components.

import { useEffect, useState } from "react";

/**
 * Returns the current Unix time in seconds, updating every 1s while `enabled` is true.
 * When `enabled` is false the timer is paused and the last value is retained.
 */
export function useNowUnix(enabled: boolean): number {
  const [nowUnix, setNowUnix] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!enabled) return;
    setNowUnix(Math.floor(Date.now() / 1000));
    const timer = window.setInterval(() => {
      setNowUnix(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return nowUnix;
}
