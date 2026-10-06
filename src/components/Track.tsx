"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

/** Fires a journey event on mount, or when the element scrolls into view if `onView` is set. */
export function Track({ event, meta, onView }: { event: string; meta?: Record<string, string | number | boolean>; onView?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!onView) {
      track(event, meta);
      return;
    }
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        track(event, meta);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <span ref={ref} aria-hidden className="block h-0 w-0" />;
}
