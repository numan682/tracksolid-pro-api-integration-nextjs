import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-2xl border border-white/70 bg-white/55 px-3 text-sm text-slate-900 outline-none backdrop-blur-xl transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white/80 focus:ring-2 focus:ring-teal-200",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
