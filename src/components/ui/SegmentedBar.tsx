import { cn } from "@/lib/cn";

export interface Segment {
  label: string;
  value: number;
  display: string;
  color: string;
}

export function SegmentedBar({
  segments,
  className,
}: {
  segments: Segment[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <div className="flex h-14 w-full overflow-hidden rounded-field">
        {segments.map((s, i) => (
          <div
            key={i}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            className="h-full"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-12 gap-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="mt-0.5 h-8 w-1 rounded-full"
              style={{ background: s.color }}
            />
            <div className="flex flex-col">
              <span className="text-sm leading-tight text-gray-1">{s.label}</span>
              <span className="text-sm font-medium leading-tight text-deep-black">
                {s.display}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
