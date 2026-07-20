import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The signature page-top heading (Figma node 2165:29332): a violet accent bar
 * (accent-bar token #9f48e1 · 4px wide · 40px tall · rounded-l-[4px]) with a
 * 12px gap before a 32px Inter Medium title (tracking -0.64px, title-ink
 * #18181b). Standardizes the treatment across every signature screen's page-top
 * heading. Scoped to the signature flow so shared chrome for the violet flows
 * is untouched. The bar color is the canonical `--color-accent-bar` token
 * (globals.css @theme) — deliberately distinct from the `violet` brand token.
 */
export function SectionHeading({
  children,
  className,
  as: Tag = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden
        className="h-10 w-1 shrink-0 rounded-l-[4px] bg-accent-bar"
      />
      <Tag className="text-[28px] font-medium leading-none tracking-[-0.64px] text-[#18181b] sm:text-[32px]">
        {children}
      </Tag>
    </div>
  );
}
