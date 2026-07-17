import {
  getSafePublicAvailability,
  type PublicAvailabilityStatus,
  type SafePublicAvailability,
} from "@/lib/publicAvailability";

const toneClasses: Record<SafePublicAvailability["tone"], string> = {
  success: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  info: "border-sky-300/35 bg-sky-300/10 text-sky-100",
  danger: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  neutral: "border-stone-300/25 bg-white/[.06] text-stone-200",
};

type Props = {
  status?: PublicAvailabilityStatus | string | null;
  availability?: SafePublicAvailability;
  showDescription?: boolean;
  className?: string;
};

export function PublicAvailabilityBadge({
  status,
  availability,
  showDescription = false,
  className = "",
}: Props) {
  const safe = availability ?? getSafePublicAvailability({ availabilityStatus: status });

  return (
    <span className={`inline-flex w-fit items-start gap-2 border px-3 py-2 ${toneClasses[safe.tone]} ${className}`}>
      <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      <span>
        <span className="block text-[10px] font-semibold uppercase tracking-[.14em]">{safe.label}</span>
        {showDescription ? <span className="mt-1 block text-[10px] leading-4 opacity-75">{safe.description}</span> : null}
      </span>
    </span>
  );
}
