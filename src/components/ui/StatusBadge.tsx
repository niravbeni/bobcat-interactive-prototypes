import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "neutral" | "muted";

const tones: Record<Tone, string> = {
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  neutral: "bg-deep-black text-white",
  muted: "bg-gray-2 text-white",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
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
