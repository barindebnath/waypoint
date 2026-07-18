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
