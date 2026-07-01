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
  /** Optional value shown right-aligned in the row (e.g. a saved summary). */
  value?: string;
}

export interface SidebarFolderItem {
  label: string;
  /** Optional right-aligned value (e.g. an account balance). */
  value?: string;
}

export interface SidebarFolder {
  title: string;
  /** Optional right-aligned value on the folder header (e.g. a total). */
  value?: string;
  /** Show a violet position badge before each item (e.g. ranked goals). */
  numbered?: boolean;
  items: SidebarFolderItem[];
}

export interface SidebarProps {
  planBadge?: SidebarBadge;
  detailsBadges?: SidebarBadge[];
  subSections?: SidebarSubSection[];
  /** Ranked goal labels (most important first) shown nested under Goals. */
  goals?: string[];
  /** Expanded "folders" (header + nested items), e.g. saved Accounts/Goals. */
  folders?: SidebarFolder[];
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

export function Sidebar({
  planBadge,
  detailsBadges,
  subSections,
  goals,
  folders,
}: SidebarProps) {
  const hideQuestions =
    (goals && goals.length > 0) || (folders && folders.length > 0);
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
                  "flex h-10 items-center justify-between gap-2 rounded-field px-3 text-base",
                  s.active
                    ? "bg-stratosphere text-white"
                    : "bg-divider/60 text-gray-1",
                )}
              >
                <span>{s.label}</span>
                {s.value ? (
                  <span
                    className={cn(
                      "truncate text-sm font-medium",
                      s.active ? "text-white/90" : "text-gray-2",
                    )}
                  >
                    {s.value}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {goals && goals.length > 0 ? (
          <div className="flex flex-col gap-1.5 pl-6">
            {goals.map((g, i) => (
              <div
                key={`${i}-${g}`}
                className="flex items-center gap-2 rounded-field bg-white px-3 py-1.5"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-stratosphere/10 text-[11px] font-semibold text-stratosphere">
                  {i + 1}
                </span>
                <span className="truncate text-sm text-gray-1">{g}</span>
              </div>
            ))}
          </div>
        ) : null}

        {folders && folders.length > 0
          ? folders.map((f) => (
              <div key={f.title} className="flex flex-col gap-1.5">
                <div className="flex h-10 items-center justify-between gap-2 rounded-field bg-divider/60 px-3 text-base text-gray-1">
                  <span>{f.title}</span>
                  {f.value ? (
                    <span className="text-sm font-medium text-gray-2">
                      {f.value}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1.5 pl-6">
                  {f.items.map((it, i) => (
                    <div
                      key={`${i}-${it.label}`}
                      className="flex items-center justify-between gap-2 rounded-field bg-white px-3 py-1.5"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {f.numbered ? (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-stratosphere/10 text-[11px] font-semibold text-stratosphere">
                            {i + 1}
                          </span>
                        ) : null}
                        <span className="truncate text-sm text-gray-1">
                          {it.label}
                        </span>
                      </span>
                      {it.value ? (
                        <span className="shrink-0 text-sm font-medium text-deep-black">
                          {it.value}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))
          : null}
      </div>

      <div className="mt-auto flex flex-col gap-4 pt-10">
        {hideQuestions ? null : (
          <>
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
          </>
        )}
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
