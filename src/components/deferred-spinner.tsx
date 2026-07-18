"use client";

import React from "react";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";

export function DeferredSpinner({
  isPending,
  className = "h-3.5 w-3.5",
}: {
  isPending: boolean;
  className?: string;
}) {
  const show = useDeferredLoading(isPending);
  if (!show) return null;
  return <Spinner className={className} />;
}
