"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const STORAGE_PREFIX = "scroll-y:";

function storageKey(pathname: string) {
  return STORAGE_PREFIX + pathname;
}

/**
 * Persists window scroll Y per route in sessionStorage and restores after reload.
 * Scroll position is updated while scrolling so client-side navigations still keep
 * the previous page's position (Next resets scroll before unmount).
 * Skips restore when the URL has a hash (in-page anchors).
 */
export function ScrollRestoration() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const raw = sessionStorage.getItem(storageKey(pathname));
    if (raw == null) return;

    const y = Number(raw);
    if (!Number.isFinite(y) || y < 0) return;

    window.scrollTo({ top: y, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;

    const raw = sessionStorage.getItem(storageKey(pathname));
    if (raw == null) return;

    const y = Number(raw);
    if (!Number.isFinite(y) || y < 0) return;

    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const maxY = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        window.scrollTo({ top: Math.min(y, maxY), left: 0, behavior: "auto" });
      });
    });

    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    const persist = () => {
      try {
        sessionStorage.setItem(
          storageKey(pathnameRef.current),
          String(window.scrollY),
        );
      } catch {
        /* quota / private mode */
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        persist();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    window.addEventListener("beforeunload", persist);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("beforeunload", persist);
      persist();
    };
  }, []);

  return null;
}
