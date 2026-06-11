"use client";

import { useEffect, useRef } from "react";
import { incrementPageView } from "@/features/services/actions";

export function PageViewTracker({ slug }: { slug: string }) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current && slug) {
      hasTracked.current = true;
      incrementPageView(slug).catch(console.error);
    }
  }, [slug]);

  return null;
}
