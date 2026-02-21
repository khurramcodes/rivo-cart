"use client";

import { Star } from "lucide-react";
import clsx from "clsx";

export function StarRating({
  value,
  outOf = 5,
  size = 16,
  className,
}: {
  value: number;
  outOf?: number;
  size?: number;
  className?: string;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(outOf, value)) : 0;

  // Simple half-star: fill the star if >= i+1, outline if <= i, otherwise treat as half
  // (Lucide doesn't have a half-star icon; we approximate by filling and lowering opacity.)
  return (
    <div className={clsx("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${safe} out of ${outOf}`}>
      {Array.from({ length: outOf }).map((_, i) => {
        const full = safe >= i + 1;
        const half = !full && safe > i && safe < i + 1;
        return (
          <Star
            key={i}
            width={size}
            height={size}
            className={clsx(
              "text-amber-500",
              full ? "fill-amber-500" : half ? "fill-amber-500 opacity-50" : "fill-transparent",
            )}
          />
        );
      })}
    </div>
  );
}

