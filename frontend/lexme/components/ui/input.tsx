import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-hidden focus:border-muted transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
