import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, type buttonVariants } from "./button";
import { type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

export interface LoadingButtonProps
  extends React.ComponentProps<typeof Button>,
    VariantProps<typeof buttonVariants> {
  /** Shows loading spinner and disables the button */
  loading?: boolean;
  /** Text to show when loading (defaults to "처리 중...") */
  loadingText?: string;
}

/**
 * LoadingButton - Button component with built-in loading state
 *
 * Usage:
 * ```tsx
 * <LoadingButton loading={isSubmitting} loadingText="저장 중...">
 *   저장
 * </LoadingButton>
 * ```
 */
export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(({ loading = false, loadingText = "처리 중...", children, disabled, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
});

LoadingButton.displayName = "LoadingButton";
