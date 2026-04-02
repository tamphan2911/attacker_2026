"use client";

import { useEffect } from "react";

export const ADMIN_TITLE_ID = "admin-page-title";

export function useAdminTitleScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const target = document.getElementById(ADMIN_TITLE_ID);
      target?.scrollIntoView({ block: "start", behavior: "auto" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [enabled]);
}
