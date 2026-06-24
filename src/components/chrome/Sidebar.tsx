"use client";

import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { CircleHelp } from "lucide-react";

export interface SidebarBadge {
  label: string;
  tone: "success" | "warning" | "neutral" | "muted";
}

export interface SidebarSubSection {
  label: string;
  active?: boolean;
}

export interface SidebarProps {
  planBadge?: SidebarBadge;
  detailsBadges?: SidebarBadge[];
  subSections?: SidebarSubSection[];
}

const QUESTIONS = [
  "How are my finances used?",
  "Why is secure account linking safe?",
  "Which accounts do I need?",
];

function PlanPill({
  label,
  badges,
}: {
  label: string;
  badges?: SidebarBadge[];
}) {
  return (
    <div className="flex h-12 items-center justify-between gap-2 overflow-hidden rounded-field bg-divider px-3">
      <span className="text-2xl leading-none tracking-[-1px] text-black">{label}</span>
      {badges && badges.length > 0 ? (
        <span className="flex shrink-0 items-center gap-1">
          {badges.map((b) => (
            <StatusBadge key={b.label} tone={b.tone}>
              {b.label}
            </StatusBadge>
          ))}
        </span>
      ) : null}
    </div>
  );
}

export function Sidebar({ planBadge, detailsBadges, subSections }: SidebarProps) {
  return (
    <aside className="flex w-[335px] shrink-0 flex-col rounded-field bg-ghost-white px-4 pb-6 pt-4 3xl:w-[400px] 3xl:px-6 4xl:w-[460px]">
      <div className="flex flex-col gap-3">
        <PlanPill label="Your Outlook" badges={planBadge ? [planBadge] : undefined} />
        <PlanPill label="Details" badges={detailsBadges} />

        {subSections && subSections.length > 0 ? (
          <div className="flex flex-col gap-2 pl-3">
            {subSections.map((s) => (
              <div
                key={s.label}
                className={cn(
                  "flex h-10 items-center rounded-field px-3 text-base",
                  s.active
                    ? "bg-stratosphere text-white"
                    : "bg-divider/60 text-gray-1",
                )}
              >
                {s.label}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-4 pt-10">
        <p className="text-base font-semibold leading-[1.4] tracking-[-0.48px] text-ink">
          Relevant questions?
        </p>
        <div className="flex flex-col gap-2">
          {QUESTIONS.map((q) => (
            <div
              key={q}
              className="flex items-center gap-4 rounded-card border border-stroke-subtle bg-white px-6 py-3"
            >
              <CircleHelp className="size-6 shrink-0 text-deep-black" strokeWidth={1.75} />
              <span className="text-sm leading-[1.25] tracking-[-0.42px] text-gray-1">{q}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-full bg-white py-2 pl-4 pr-2">
          <span className="text-base leading-[1.25] tracking-[-0.48px] text-gray-2">
            Ask a question
          </span>
          <button
            className="shrink-0 rounded-full transition-opacity hover:opacity-80"
            aria-label="Send question"
          >
            <AskSendIcon className="size-[30px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
