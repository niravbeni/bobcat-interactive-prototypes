import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "neutral" | "muted" | "brand";

const tones: Record<Tone, string> = {
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  neutral: "bg-deep-black text-white",
  muted: "bg-gray-2 text-white",
  brand: "bg-violet text-white",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-[5px] text-[10px] font-medium leading-none tracking-[-0.2px] whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
