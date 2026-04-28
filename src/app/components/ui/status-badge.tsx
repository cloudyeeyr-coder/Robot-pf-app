import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * StatusBadge - Standardized status badges across the platform
 * Use this for contract statuses, escrow states, AS ticket statuses, proposal statuses, etc.
 */

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap",
  {
    variants: {
      status: {
        // Contract & General Statuses
        pending: "bg-warning-50 text-warning-700 border border-warning-200",
        active: "bg-success-50 text-success-700 border border-success-200",
        completed: "bg-success-50 text-success-700 border border-success-200",
        cancelled: "bg-gray-100 text-gray-700 border border-gray-200",
        expired: "bg-gray-100 text-gray-600 border border-gray-200",

        // Escrow States
        held: "bg-primary-50 text-primary-700 border border-primary-200",
        released: "bg-success-50 text-success-700 border border-success-200",
        refunded: "bg-destructive-50 text-destructive-700 border border-destructive-200",

        // Dispute & Issues
        disputed: "bg-destructive-50 text-destructive-700 border border-destructive-200",

        // Proposal Statuses
        accepted: "bg-success-50 text-success-700 border border-success-200",
        rejected: "bg-destructive-50 text-destructive-700 border border-destructive-200",

        // AS Ticket Statuses
        reported: "bg-warning-50 text-warning-700 border border-warning-200",
        assigned: "bg-primary-50 text-primary-700 border border-primary-200",
        dispatched: "bg-info-50 text-info-700 border border-info-200",
        resolved: "bg-success-50 text-success-700 border border-success-200",

        // Badge Statuses
        revoked: "bg-destructive-50 text-destructive-700 border border-destructive-200",

        // Priority
        urgent: "bg-destructive-500 text-white border-0",
        normal: "bg-gray-100 text-gray-700 border border-gray-200",

        // Approval States
        approved: "bg-success-50 text-success-700 border border-success-200",

        // Payment States
        release_pending: "bg-warning-50 text-warning-700 border border-warning-200",

        // Booking States
        confirmed: "bg-success-50 text-success-700 border border-success-200",

        // Inspection States
        inspection_passed: "bg-success-50 text-success-700 border border-success-200",
        inspection_failed: "bg-destructive-50 text-destructive-700 border border-destructive-200",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
);

// Korean label mapping
const statusLabels: Record<string, string> = {
  // General
  pending: "대기 중",
  active: "활성",
  completed: "완료됨",
  cancelled: "취소됨",
  expired: "만료됨",

  // Escrow
  held: "예치 완료",
  released: "방출 완료",
  refunded: "환불됨",

  // Disputes
  disputed: "분쟁 중",

  // Proposals
  accepted: "수락됨",
  rejected: "거절됨",

  // AS Tickets
  reported: "접수됨",
  assigned: "배정됨",
  dispatched: "출동 중",
  resolved: "완료",

  // Badges
  revoked: "철회됨",

  // Priority
  urgent: "긴급",
  normal: "일반",

  // Approval
  approved: "승인됨",

  // Payment
  release_pending: "방출 대기",

  // Booking
  confirmed: "확정됨",

  // Inspection
  inspection_passed: "검수 합격",
  inspection_failed: "검수 불합격",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Custom label (defaults to Korean label for status) */
  label?: string;
  /** Show a colored dot indicator */
  showDot?: boolean;
}

export function StatusBadge({
  className,
  status,
  label,
  showDot = false,
  ...props
}: StatusBadgeProps) {
  const displayLabel = label || (status ? statusLabels[status] : "");

  return (
    <span
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {showDot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}
