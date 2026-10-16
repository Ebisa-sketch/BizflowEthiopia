"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * A slim top-of-screen loading progress bar (like YouTube/GitHub)
 * that animates during Next.js route transitions.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // When pathname changes, the new page has loaded
    if (prevPathRef.current !== pathname) {
      // Complete the bar
      setProgress(100);
      completeTimerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      prevPathRef.current = pathname;
    }

    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [pathname]);

  // Intercept link clicks to start the progress bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (target.getAttribute("target") === "_blank") return;
      if (href === pathname) return;

      // Start progress animation
      setProgress(0);
      setVisible(true);

      if (timerRef.current) clearInterval(timerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);

      let current = 0;
      // Rapidly fill to ~80%, then slow down
      timerRef.current = setInterval(() => {
        current += current < 50 ? 8 : current < 80 ? 3 : 0.5;
        if (current >= 90) {
          current = 90;
          if (timerRef.current) clearInterval(timerRef.current);
        }
        setProgress(current);
      }, 100);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
