"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PipelineKey } from "@/lib/client-api";
import { RequestError } from "@/lib/client-api";

export function NewRowForm() {
  const qc = useQueryClient();
  const [ref, setRef] = useState("");
  const [origin, setOrigin] = useState<"support" | "product">("support");
  const [subType, setSubType] = useState<"bug" | "task">("bug");
  const [pipelineOverride, setPipelineOverride] = useState<"" | PipelineKey>("");
  const [error, setError] = useState<string | null>(null);

  const defaultPipeline: PipelineKey =
    origin === "product" ? "feature" : subType === "task" ? "support_light" : "support_full";

  const createMut = useMutation({
    mutationFn: () =>
      api.createRow({
        identityRef: ref.trim(),
        origin,
        subType: origin === "support" ? subType : null,
        pipelineKey: pipelineOverride || undefined,
      }),
    onSuccess: () => {
      setRef("");
      setPipelineOverride("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["rows"] });
    },
    onError: (e) => setError(e instanceof RequestError ? e.message : "Failed to create row"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ref.trim()) createMut.mutate();
      }}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2"
    >
      <input
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder={origin === "support" ? "ZT-1234" : "OFF-5678"}
        className="w-32 rounded border border-edge bg-surface-2 px-2 py-1.5 font-mono text-sm outline-none focus:border-live"
        aria-label="Identity card ref"
      />
      <select
        value={origin}
        onChange={(e) => setOrigin(e.target.value as "support" | "product")}
        className="rounded border border-edge bg-surface-2 px-2 py-1.5 text-sm"
        aria-label="Origin"
      >
        <option value="support">Support</option>
        <option value="product">Product</option>
      </select>
      {origin === "support" && (
        <select
          value={subType}
          onChange={(e) => setSubType(e.target.value as "bug" | "task")}
          className="rounded border border-edge bg-surface-2 px-2 py-1.5 text-sm"
          aria-label="Sub-type"
        >
          <option value="bug">Bug</option>
          <option value="task">Task</option>
        </select>
      )}
      <select
        value={pipelineOverride || defaultPipeline}
        onChange={(e) => {
          const v = e.target.value as PipelineKey;
          setPipelineOverride(v === defaultPipeline ? "" : v);
        }}
        className="rounded border border-edge bg-surface-2 px-2 py-1.5 text-sm text-ink-muted"
        aria-label="Pipeline"
        title="Pipeline defaults from origin + sub-type; override if needed"
      >
        {origin === "support" ? (
          <>
            <option value="support_full">Support pipeline</option>
            <option value="support_light">Support · light pipeline</option>
          </>
        ) : (
          <option value="feature">Feature pipeline</option>
        )}
      </select>
      <button
        type="submit"
        disabled={createMut.isPending || !ref.trim()}
        className="rounded bg-live/90 px-3 py-1.5 text-sm font-medium text-bg hover:bg-live disabled:opacity-40"
      >
        {createMut.isPending ? "Adding…" : "+ Add row"}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </form>
  );
}
