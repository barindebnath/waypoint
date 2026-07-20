"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PipelineKey } from "@/lib/client-api";
import { RequestError } from "@/lib/client-api";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";

const PIPELINE_LABELS: Record<PipelineKey, string> = {
  support_full: "Support",
  support_light: "Support · light",
  feature: "Feature",
};

export function NewRowForm() {
  const qc = useQueryClient();
  const [ref, setRef] = useState("");
  const [origin, setOrigin] = useState<"support" | "product">("support");
  const [subType, setSubType] = useState<"bug" | "task">("bug");
  const [error, setError] = useState<string | null>(null);

  const pipeline: PipelineKey =
    origin === "product" ? "feature" : subType === "task" ? "support_light" : "support_full";

  const createMut = useMutation({
    mutationFn: () =>
      api.createRow({
        identityRef: ref.trim(),
        origin,
        subType: origin === "support" ? subType : null,
      }),
    onSuccess: () => {
      setRef("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["rows"] });
    },
    onError: (e) => setError(e instanceof RequestError ? e.message : "Failed to create row"),
  });

  const showCreatingLoader = useDeferredLoading(createMut.isPending);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ref.trim()) createMut.mutate();
      }}
      className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-edge bg-surface px-4 py-3.5 shadow-card"
    >
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint shrink-0">New row</span>
      
      <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder={origin === "support" ? "ZT-1234" : "OFF-5678"}
          className="flex-1 min-w-[100px] sm:flex-initial sm:w-[120px] rounded-[7px] border border-edge bg-surface-2 px-2.5 py-[7px] font-mono text-[13px] outline-none focus:border-accent"
          aria-label="Identity card ref"
        />
        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value as "support" | "product")}
          className="rounded-[7px] border border-edge bg-surface-2 px-2 py-[7px] text-[13px] cursor-pointer animate-none"
          aria-label="Origin"
        >
          <option value="support">Support</option>
          <option value="product">Product</option>
        </select>
        {origin === "support" && (
          <select
            value={subType}
            onChange={(e) => setSubType(e.target.value as "bug" | "task")}
            className="rounded-[7px] border border-edge bg-surface-2 px-2 py-[7px] text-[13px] cursor-pointer animate-none"
            aria-label="Sub-type"
          >
            <option value="bug">Bug</option>
            <option value="task">Task</option>
          </select>
        )}
        <span className="font-serif text-xs italic text-ink-faint shrink-0">
          → {PIPELINE_LABELS[pipeline]} pipeline
        </span>
      </div>

      {error && <span className="text-xs text-danger shrink-0">{error}</span>}
      
      <button
        type="submit"
        disabled={createMut.isPending || !ref.trim()}
        className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1.5 rounded-[7px] bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink hover:opacity-90 disabled:opacity-40 cursor-pointer"
      >
        {showCreatingLoader && <Spinner className="h-3.5 w-3.5 text-current" />}
        {createMut.isPending ? "Adding…" : "+ Add row"}
      </button>
    </form>
  );
}
