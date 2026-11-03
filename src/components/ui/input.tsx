import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
