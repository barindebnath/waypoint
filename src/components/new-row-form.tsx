"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PipelineKey } from "@/lib/client-api";
import { RequestError } from "@/lib/client-api";
import { useDeferredLoading } from "@/lib/use-deferred-loading";
import { parseSmartCardInput } from "@/lib/smart-parser";
import { CloseIcon, PlusIcon } from "./icons";
import { Spinner } from "./spinner";

const PIPELINE_LABELS: Record<PipelineKey, string> = {
  support_full: "Support",
  support_light: "Support · light",
  feature: "Feature",
};

const TYPES = [
  { key: "product", label: "Product feature" },
  { key: "bug", label: "Support bug" },
  { key: "task", label: "Support task" },
] as const;

/**
 * A control to create a row. It opens a dialog with one field.
 * The dialog closes after a card is added, on Escape, and on a click outside it.
 * Pasting a Jira or PR URL fills the fields.
 *
 * `primary` is the lime button in the Board header. `lane` is the quiet "Add card" row
 * at the bottom of the first Board column.
 */
export function NewRowForm({ variant = "primary" }: { variant?: "primary" | "lane" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {variant === "primary" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex h-10 items-center gap-2 rounded-2xl bg-accent px-4 text-[13px] font-semibold text-accent-ink transition hover:brightness-110 active:scale-[0.98]"
        >
          <PlusIcon className="h-4 w-4" />
          New card
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-card text-[13px] font-medium text-ink-faint transition-colors hover:bg-card hover:text-ink"
        >
          <PlusIcon className="h-4 w-4" />
          Add card
        </button>
      )}
      {/* The dialog mounts only when open, so its fields start empty each time. */}
      {isOpen && <NewRowDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}

function NewRowDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const [ref, setRef] = useState("");
  const [origin, setOrigin] = useState<"support" | "product">("product");
  const [subType, setSubType] = useState<"bug" | "task">("bug");
  const [pendingPrRef, setPendingPrRef] = useState<string | null>(null);
  const [detectFeedback, setDetectFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // No cleanup: a close() here sends a "close" event, and Strict Mode would then close the dialog at once.
  // The field gets the focus after showModal(). React runs autoFocus too early, before the dialog is open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    fieldRef.current?.focus();
  }, []);

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
      qc.invalidateQueries({ queryKey: ["rows"] });
      onClose();
    },
    onError: (e) => setError(e instanceof RequestError ? e.message : "Failed to create row"),
  });

  const showCreatingLoader = useDeferredLoading(createMut.isPending);

  // This parser only helps the user. It fills the fields from a pasted URL.
  // The server validates the ref and the type again, so the client check is not a security control.
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

  const selectedType = origin === "product" ? "product" : subType;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-card-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop has the dialog itself as the target.
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[min(480px,calc(100vw-1.5rem))] rounded-[28px] border border-edge bg-bg p-0 text-ink shadow-pop outline-none"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ref.trim()) createMut.mutate();
        }}
        className="flex flex-col gap-5 p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="new-card-title" className="text-[20px] font-semibold tracking-tight">
              New card
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
              Enter the card ref, or paste a Jira or GitHub URL. Waypoint fills in the type for you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <CloseIcon className="h-[18px] w-[18px]" />
          </button>
        </header>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-ink-muted">Identity card ref</span>
          <input
            ref={fieldRef}
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
            placeholder="ZT-4821 or a Jira URL"
            className="h-12 w-full rounded-2xl border border-edge bg-surface-2 px-4 font-mono text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-medium text-ink-muted">Type</span>
          <div role="group" aria-label="Card type" className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const on = selectedType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setOrigin(t.key === "product" ? "product" : "support");
                    if (t.key !== "product") setSubType(t.key);
                    setDetectFeedback(null);
                  }}
                  className={`h-9 rounded-full px-4 text-[13px] font-medium transition-colors ${
                    on ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink-muted hover:bg-surface-3 hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-xs text-ink-faint">
            {PIPELINE_LABELS[pipeline]} pipeline
            {pendingPrRef && <span className="font-mono"> · will link {pendingPrRef}</span>}
            {!pendingPrRef && detectFeedback && <span> · {detectFeedback}</span>}
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-2xl px-4 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMut.isPending || !ref.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-accent px-5 text-[13px] font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-40"
          >
            {showCreatingLoader && <Spinner className="h-3.5 w-3.5 text-current" />}
            Add card
          </button>
        </div>
      </form>
    </dialog>
  );
}
