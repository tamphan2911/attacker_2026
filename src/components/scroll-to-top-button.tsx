"use client";

import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

const SCROLL_TOP_VISIBILITY_OFFSET = 320;

export function ScrollToTopButton() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  const syncVisibility = useEffectEvent(() => {
    setIsVisible(window.scrollY > SCROLL_TOP_VISIBILITY_OFFSET);
  });

  useEffect(() => {
    syncVisibility();

    let frameId = 0;

    const handleScroll = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        syncVisibility();
        frameId = 0;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    syncVisibility();
  }, [pathname]);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`theme-scroll-top-button fixed bottom-5 right-5 z-[72] inline-flex h-12 w-12 items-center justify-center rounded-full border transition-[opacity,transform,box-shadow,background-color,border-color,color] duration-300 ease-out md:bottom-8 md:right-8 ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
          : "pointer-events-none translate-y-4 opacity-0 scale-95"
      }`}
    >
      <ArrowUp className="h-4.5 w-4.5" />
      <span className="sr-only">Scroll to top</span>
    </button>
  );
}
