export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="epGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#epGrad)" />
      <path
        d="M10 25.5h6.5l3-7.5 5 15 3.5-9 2.5 4.5H38"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="23" r="3.4" fill="#fbbf24" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="font-display text-[17px] font-extrabold tracking-tight text-ink-900">
      Edu<span className="gradient-text">Pulse</span>
    </span>
  );
}
