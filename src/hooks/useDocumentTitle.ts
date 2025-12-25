"use client";

import { useEffect } from "react";

/**
 * Safely update the document title on the client.
 * No-ops during SSR so server rendering does not crash.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    if (!title || typeof document === "undefined") return;
    document.title = title;
  }, [title]);
}
