import type { ReactNode } from "react";

/**
 * Shared building blocks for the pages. They keep the shape of the app the same everywhere:
 * round corners, one input style, one set of buttons.
 * The class strings are plain constants, so a page can add its own classes next to them.
 */

/** A text field, a select or a text area. The height is for a single line. */
export const inputClass =
  "h-11 w-full rounded-xl border border-edge bg-surface-2 px-3.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent disabled:opacity-60";

const btnBase =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[13px] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

/** The main action of a view. One per view. */
export const btnPrimary = `${btnBase} h-10 bg-accent px-4 font-semibold text-accent-ink hover:brightness-110`;
/** A normal action. */
export const btnSecondary = `${btnBase} h-10 bg-surface-2 px-4 font-medium text-ink ring-1 ring-edge hover:bg-surface-3`;
/** A quiet action, for example Cancel. */
export const btnGhost = `${btnBase} h-10 px-4 font-medium text-ink-muted hover:bg-surface-2 hover:text-ink`;
/** An action that deletes or revokes. */
export const btnDanger = `${btnBase} h-10 px-4 font-medium text-danger ring-1 ring-danger/50 hover:bg-danger/10`;
/** A small round action, for example a row action. */
export const btnPill =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-surface-2 px-4 text-xs font-semibold text-ink-muted ring-1 ring-edge transition-colors hover:bg-surface-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

/**
 * The top of a page inside the main panel: an icon tile, the title, a line of text,
 * then the children (for example a filter) and the actions on the right.
 */
export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-6">
      <div className="order-1 flex min-w-0 items-center gap-3 sm:gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface text-accent-fg sm:h-12 sm:w-12 [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-6 sm:[&>svg]:w-6">
          {icon}
        </span>
        <div className="min-w-0">
          <h1 className="font-serif text-[24px] font-semibold leading-none tracking-tight sm:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[13px] text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {/* On a narrow screen the actions sit next to the title and the children get their own row. */}
      {children && <div className="order-3 min-w-0 max-w-full sm:order-2">{children}</div>}
      {actions && <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:flex-wrap">{actions}</div>}
    </header>
  );
}

/**
 * A rounded card for a group of settings or a chart. With a title it has a header row:
 * an optional icon, the title, a line of text and optional actions on the right.
 */
export function Card({
  title,
  description,
  icon,
  actions,
  className = "",
  children,
}: {
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-edge bg-surface p-5 ${className}`}>
      {title && (
        <header className="mb-4 flex items-start gap-3">
          {icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent-fg [&>svg]:h-[18px] [&>svg]:w-[18px]">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-snug tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
