"use client";

import { useState, useEffect } from "react";

export function useDeferredLoading(isPending: boolean, delayMs = 200) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!isPending) {
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(true);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      setShowLoading(false);
    };
  }, [isPending, delayMs]);

  return isPending && showLoading;
}
