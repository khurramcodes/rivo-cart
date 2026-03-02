import clsx from "clsx";

export function Button({
  variant = "primary",
  rounded = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "secondary";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center px-4 py-2 font-medium transition-all duration-200 cursor-pointer",
        "disabled:opacity-50 disabled:pointer-events-none",

        // rounded variants
        rounded === "none" && "rounded-none",
        rounded === "sm" && "rounded-sm",
        rounded === "md" && "rounded-md",
        rounded === "lg" && "rounded-lg",
        rounded === "xl" && "rounded-xl",
        rounded === "full" && "rounded-full",

        // color variants
        variant === "primary" &&
          "bg-primary text-white hover:bg-secondary shadow-sm hover:shadow-md",
        variant === "ghost" && "bg-transparent text-zinc-700 hover:bg-zinc-100",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
        variant === "secondary" &&
          "bg-muted/80 text-zinc-900 hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}


