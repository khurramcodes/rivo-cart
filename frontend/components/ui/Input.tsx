import React from "react";
import clsx from "clsx";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
        "h-10 w-full rounded border border-zinc-200 bg-transparent px-3 text-sm text-zinc-900 outline-none",
        "placeholder:text-zinc-600",
        "focus:ring-2 focus:ring-black/10 focus:border-zinc-300",
          className,
        )}
        {...props}
      />
    );
  }
);


