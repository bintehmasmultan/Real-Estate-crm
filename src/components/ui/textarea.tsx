import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[90px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";
