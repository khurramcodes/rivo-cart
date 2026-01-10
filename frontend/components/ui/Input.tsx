import clsx from "clsx";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-10 w-full rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none",
        "placeholder:text-zinc-400",
        "focus:ring-2 focus:ring-black/10 focus:border-zinc-300",
        className,
      )}
      {...props}
    />
  );
}


