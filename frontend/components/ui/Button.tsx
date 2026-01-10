import clsx from "clsx";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "secondary";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded px-4 py-2 font-medium transition-all duration-200 cursor-pointer",
        "disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "bg-black text-white hover:bg-zinc-800 shadow-sm hover:shadow-md",
        variant === "ghost" && "bg-transparent text-zinc-700 hover:bg-zinc-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
        variant === "secondary" && "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        className,
      )}
      {...props}
    />
  );
}


