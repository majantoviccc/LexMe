import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none bg-transparent text-foreground placeholder:text-muted focus:outline-hidden",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
