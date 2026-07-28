"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PipelineKey } from "@/lib/client-api";
import { RequestError } from "@/lib/client-api";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { Spinner } from "./spinner";
import { PlusIcon } from "./status-badge";

const PIPELINE_LABELS: Record<PipelineKey, string> = {
  support_full: "Support",
  support_light: "Support · light",
  feature: "Feature",
};

export function NewRowForm({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [ref, setRef] = useState("");
  const [origin, setOrigin] = useState<"support" | "product">("product");
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

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mb-3 sm:mb-5 flex items-center justify-between w-full rounded-xl border border-dashed border-edge-strong bg-surface/40 hover:bg-surface px-4 py-2.5 text-xs sm:text-[13px] font-medium text-ink-muted hover:text-accent hover:border-accent/60 transition-all cursor-pointer group"
      >
        <span className="flex items-center gap-2">
          <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-ink transition-colors">
            <PlusIcon className="h-3 w-3" />
          </span>
          <span>Add new row card…</span>
        </span>
        <span className="text-[11px] font-normal text-ink-faint italic">Click to expand form</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ref.trim()) createMut.mutate();
      }}
      className="mb-3 sm:mb-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-edge bg-surface px-3 py-2.5 sm:px-4 sm:py-3.5 shadow-card transition-all"
    >
      <div className="flex items-center justify-between sm:justify-start gap-2">
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-ink-faint shrink-0">New row</span>
        <span className="inline sm:hidden font-serif text-[11px] italic text-ink-faint">
          → {PIPELINE_LABELS[pipeline]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 w-full sm:w-auto">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder={origin === "support" ? "ZT-1234" : "OFF-5678"}
          className="flex-1 min-w-[90px] sm:flex-initial sm:w-[120px] rounded-[7px] border border-edge bg-surface-2 px-2 py-1 sm:px-2.5 sm:py-[7px] font-mono text-xs sm:text-[13px] outline-none focus:border-accent"
          aria-label="Identity card ref"
          autoFocus
        />
        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value as "support" | "product")}
          className="rounded-[7px] border border-edge bg-surface-2 px-1.5 py-1 sm:px-2 sm:py-[7px] text-xs sm:text-[13px] cursor-pointer animate-none"
          aria-label="Origin"
        >
          <option value="product">Product</option>
          <option value="support">Support</option>
        </select>
        {origin === "support" && (
          <select
            value={subType}
            onChange={(e) => setSubType(e.target.value as "bug" | "task")}
            className="rounded-[7px] border border-edge bg-surface-2 px-1.5 py-1 sm:px-2 sm:py-[7px] text-xs sm:text-[13px] cursor-pointer animate-none"
            aria-label="Sub-type"
          >
            <option value="bug">Bug</option>
            <option value="task">Task</option>
          </select>
        )}
        <span className="hidden sm:inline font-serif text-xs italic text-ink-faint shrink-0">
          → {PIPELINE_LABELS[pipeline]} pipeline
        </span>
      </div>

      {error && <span className="text-xs text-danger shrink-0">{error}</span>}

      <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
        <button
          type="submit"
          disabled={createMut.isPending || !ref.trim()}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-[7px] bg-accent px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-[13px] font-semibold text-accent-ink hover:opacity-90 disabled:opacity-40 cursor-pointer"
        >
          {showCreatingLoader && <Spinner className="h-3.5 w-3.5 text-current" />}
          {createMut.isPending ? "Adding…" : "+ Add row"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-2.5 py-1.5 sm:py-2 text-ink-faint hover:text-ink text-xs font-medium rounded-[7px] border border-edge bg-surface-2 hover:border-edge-strong cursor-pointer"
          title="Hide form"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
