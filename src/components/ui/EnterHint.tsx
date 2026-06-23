import { CornerDownLeft } from "lucide-react";

/** Small "press Enter ↵" affordance shown next to a submit button. */
export function EnterHint({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm text-gray-2 ${className ?? ""}`}
    >
      press <span className="font-semibold text-deep-black">Enter</span>
      <CornerDownLeft className="size-4" strokeWidth={2} />
    </span>
  );
}
