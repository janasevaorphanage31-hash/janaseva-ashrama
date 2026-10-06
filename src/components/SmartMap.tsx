"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Defers Google Maps iframe creation until the block is near viewport.
 * This reduces initial JS/network cost on mobile.
 */
export function SmartMap({ embedUrl, mapsUrl }: { embedUrl: string; mapsUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || ready) return;

    if (!("IntersectionObserver" in window)) {
      requestAnimationFrame(() => setReady(true));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin: "260px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  return (
    <div ref={ref} className="h-64 w-full bg-sand">
      {ready ? (
        <iframe
          title="Janaseva location map"
          src={embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      ) : (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener"
          className="focus-ring grid h-full w-full place-items-center text-center"
        >
          <span className="rounded-xl bg-teal-800 px-5 py-2 text-sm font-bold text-white">Tap to open map</span>
        </a>
      )}
    </div>
  );
}
