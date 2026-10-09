"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PipelineKey } from "@/lib/client-api";
import { RequestError } from "@/lib/client-api";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { parseSmartCardInput } from "@/lib/smart-parser";
import { Spinner } from "./spinner";
import { PlusIcon } from "./status-badge";

const PIPELINE_LABELS: Record<PipelineKey, string> = {
  support_full: "Support",
  support_light: "Support · light",
  feature: "Feature",
};

/**
 * The Board header control to create a row: a small button that opens one inline row,
 * and closes after a card is added or on Escape. Pasting a Jira or PR URL fills the fields.
 */
export function NewRowForm() {
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [origin, setOrigin] = useState<"support" | "product">("product");
  const [subType, setSubType] = useState<"bug" | "task">("bug");
  const [pendingPrRef, setPendingPrRef] = useState<string | null>(null);
  const [detectFeedback, setDetectFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pipeline: PipelineKey =
    origin === "product" ? "feature" : subType === "task" ? "support_light" : "support_full";

  const createMut = useMutation({
    mutationFn: async () => {
      const rowRes = await api.createRow({
        identityRef: ref.trim(),
        origin,
        subType: origin === "support" ? subType : null,
      });

      if (pendingPrRef) {
        try {
          await api.updateRefs(rowRes.row.identityRef, "add", { ref: pendingPrRef });
        } catch {
          // Non-blocking PR linking error
        }
      }

      return rowRes;
    },
    onSuccess: () => {
      setIsOpen(false);
      setRef("");
      setPendingPrRef(null);
      setDetectFeedback(null);
      setError(null);
      qc.invalidateQueries({ queryKey: ["rows"] });
    },
    onError: (e) => setError(e instanceof RequestError ? e.message : "Failed to create row"),
  });

  const showCreatingLoader = useDeferredLoading(createMut.isPending);

  const applySmartInput = (inputVal: string) => {
    const parsed = parseSmartCardInput(inputVal);
    if (parsed.identityRef) {
      setRef(parsed.identityRef);
      setOrigin(parsed.origin);
      setSubType(parsed.subType);
      if (parsed.linkedPrRef) {
        setPendingPrRef(parsed.linkedPrRef);
      }
      if (parsed.confidenceLabel) {
        setDetectFeedback(parsed.confidenceLabel);
      }
    } else {
      setRef(inputVal);
    }
  };

  const close = () => {
    setIsOpen(false);
    setRef("");
    setError(null);
    setDetectFeedback(null);
    setPendingPrRef(null);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-edge bg-surface px-3 py-1 text-[11.5px] font-semibold text-ink-muted hover:border-accent hover:text-accent transition-colors cursor-pointer"
      >
        <PlusIcon className="h-3 w-3" />
        New card
      </button>
    );
  }

  const fieldClass =
    "rounded-[7px] border border-edge bg-surface-2 px-2 py-1 text-xs outline-none focus:border-accent";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ref.trim()) createMut.mutate();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
      className="flex flex-wrap items-center gap-1.5"
    >
      <input
        value={ref}
        onChange={(e) => {
          const val = e.target.value;
          if (val.includes("http://") || val.includes("https://") || val.includes("/") || val.includes("#")) {
            applySmartInput(val);
          } else {
            setRef(val);
          }
        }}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          if (pasted && (pasted.includes("http://") || pasted.includes("https://") || pasted.includes("/") || pasted.includes("#") || pasted.includes(" "))) {
            e.preventDefault();
            applySmartInput(pasted);
          }
        }}
        placeholder="Card ref or Jira URL"
        className={`${fieldClass} w-44 font-mono`}
        aria-label="Identity card ref"
        title={pendingPrRef ? `Will link PR ${pendingPrRef}` : detectFeedback ?? undefined}
        autoFocus
      />
      <select
        value={origin === "product" ? "product" : subType}
        onChange={(e) => {
          const v = e.target.value as "product" | "bug" | "task";
          setOrigin(v === "product" ? "product" : "support");
          if (v !== "product") setSubType(v);
          setDetectFeedback(null);
        }}
        className={`${fieldClass} cursor-pointer`}
        aria-label="Card type"
        title={`${PIPELINE_LABELS[pipeline]} pipeline`}
      >
        <option value="product">Product</option>
        <option value="bug">Support bug</option>
        <option value="task">Support task</option>
      </select>
      <button
        type="submit"
        disabled={createMut.isPending || !ref.trim()}
        className="flex items-center gap-1.5 rounded-[7px] bg-accent px-3 py-1 text-xs font-semibold text-accent-ink hover:opacity-90 disabled:opacity-40 cursor-pointer"
      >
        {showCreatingLoader && <Spinner className="h-3 w-3 text-current" />}
        Add
      </button>
      <button
        type="button"
        onClick={close}
        aria-label="Cancel"
        className="px-1.5 text-base leading-none text-ink-faint hover:text-ink cursor-pointer"
      >
        ×
      </button>
      {pendingPrRef && <span className="font-mono text-[10.5px] text-ink-faint">+ {pendingPrRef}</span>}
      {error && <span className="w-full text-[11px] text-danger">{error}</span>}
    </form>
  );
}
