import React, { useId } from "react";

export function Logo({ className = "h-6 w-6 shrink-0" }: { className?: string }) {
  const maskId = useId();
  return (
    <svg className={className} viewBox="0 0 26 26" fill="none">
      <defs>
        <mask id={maskId}>
          <rect width="26" height="26" fill="white" />
          <path d="M4 13h18" stroke="black" strokeWidth="2.4" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <circle cx="4" cy="13" r="3.4" fill="#38C2A8" />
        <circle cx="13" cy="13" r="3.4" fill="#38C2A8" />
        <circle cx="22" cy="13" r="3.4" fill="#F5B14C" />
      </g>
    </svg>
  );
}

/**
 * The brand mark on a rounded accent tile. The three waypoints take the dark ink of the
 * accent, so the tile reads the same in every palette. `className` sizes the tile.
 */
export function LogoTile({ className = "h-10 w-10" }: { className?: string }) {
  const maskId = useId();
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[14px] bg-accent text-accent-ink shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] ${className}`}
      aria-hidden="true"
    >
      <svg className="h-[58%] w-[58%]" viewBox="0 0 26 26" fill="none">
        <defs>
          <mask id={maskId}>
            <rect width="26" height="26" fill="white" />
            <path d="M4 13h18" stroke="black" strokeWidth="2.4" />
          </mask>
        </defs>
        <g mask={`url(#${maskId})`} fill="currentColor">
          <circle cx="4" cy="13" r="3.6" />
          <circle cx="13" cy="13" r="3.6" />
          <circle cx="22" cy="13" r="3.6" />
        </g>
      </svg>
    </span>
  );
}
