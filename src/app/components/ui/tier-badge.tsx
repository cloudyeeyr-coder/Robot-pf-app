import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Award } from "lucide-react";
import { cn } from "./utils";

/**
 * TierBadge - SI Partner tier badges (Silver, Gold, Diamond)
 */

const tierBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap",
  {
    variants: {
      tier: {
        silver: "bg-tier-silver-bg text-tier-silver-text border border-gray-300",
        gold: "bg-tier-gold-bg text-tier-gold-text border border-yellow-300",
        diamond: "bg-gradient-to-r from-tier-diamond-bg to-cyan-100 text-tier-diamond-text border border-cyan-300",
      },
    },
    defaultVariants: {
      tier: "silver",
    },
  }
);

const tierLabels: Record<string, string> = {
  silver: "실버 등급",
  gold: "골드 등급",
  diamond: "다이아몬드 등급",
};

export interface TierBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tierBadgeVariants> {
  /** Custom label (defaults to Korean tier label) */
  label?: string;
  /** Show award icon */
  showIcon?: boolean;
}

export function TierBadge({
  className,
  tier,
  label,
  showIcon = true,
  ...props
}: TierBadgeProps) {
  const displayLabel = label || (tier ? tierLabels[tier] : "");

  return (
    <span
      className={cn(tierBadgeVariants({ tier }), className)}
      {...props}
    >
      {showIcon && <Award className="h-3 w-3" aria-hidden="true" />}
      {displayLabel}
    </span>
  );
}
