import { cn } from "@/lib/cn";

export function MandarinBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-mandarin/20 px-4 py-3 text-sm font-semibold leading-[1.4] text-mandarin whitespace-nowrap",
        className,
      )}
    >
      {children}
    </span>
  );
}
