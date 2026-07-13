"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Lock, Pencil } from "lucide-react";
import { cn } from "@/lib/cn";
import { InfoTarget } from "./DetailsInfoTip";
import type { DetailsInfoTipId } from "@/lib/detailsInfoTips";

/**
 * Click-to-edit primitives for the Details-flow sidebar. These are duplicated
 * verbatim from the (private) equivalents inside OutlookSidebar.tsx so the
 * Outlook flow stays completely untouched.
 */

/** Violet check chip shown next to each completed sidebar section. */
export function SectionCheck() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet text-white">
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}

/**
 * A click-to-edit value. Renders as bold text with a pencil affordance; clicking
 * swaps in a text input that commits on Enter/blur (Escape cancels). Purely
 * local prototype editing — the parent owns the persisted value.
 */
export function EditableValue({
  value,
  onChange,
  align = "right",
}: {
  value: string;
  onChange: (next: string) => void;
  align?: "left" | "right";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    onChange(draft.trim() || value);
    setEditing(false);
  };
  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={cn(
          "w-full min-w-0 rounded border border-violet/50 bg-white px-1.5 py-0.5 text-xs font-semibold text-deep-black focus:outline-none focus:ring-1 focus:ring-violet",
          align === "right" ? "text-right" : "text-left",
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        "group/edit flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-violet/5",
        align === "right" ? "justify-end text-right" : "justify-start text-left",
      )}
    >
      <span className="min-w-0 truncate font-semibold text-deep-black">{value}</span>
      <Pencil
        className="size-3 shrink-0 text-gray-2/70 transition-colors group-hover/edit:text-violet"
        strokeWidth={2}
      />
    </button>
  );
}

/**
 * Labelled rows with a small uppercase caption and a click-to-edit value below,
 * matching the "DETAIL TITLE / Provided value" pattern in the Details frames.
 */
export function EditableRows({
  rows,
  onChange,
}: {
  rows: [string, string][];
  onChange: (rows: [string, string][]) => void;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map(([label, value], i) => (
        <li key={`${label}-${i}`} className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
            {label}
          </span>
          <div className="flex min-w-0">
            <EditableValue
              value={value}
              align="left"
              onChange={(next) => {
                const copy = rows.map((r) => [...r] as [string, string]);
                copy[i][1] = next;
                onChange(copy);
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * A single collapsible sidebar section: a pill header that toggles open, and an
 * animated content panel. Open sections adopt the dark "active" treatment; the
 * closed sections keep the green-check white pill. A `locked` section is greyed
 * out, shows a lock icon, and can't be expanded.
 */
export function AccordionSection({
  label,
  open,
  active = false,
  onToggle,
  onOpenPage,
  children,
  locked = false,
  readOnly = false,
  complete = true,
  infoTipId,
}: {
  label: string;
  open: boolean;
  /** Whether this section is the current page — drives the dark highlight. */
  active?: boolean;
  onToggle: () => void;
  /**
   * When provided, clicking the section label navigates to its detail page,
   * while the chevron continues to expand/collapse the inline editor. When
   * omitted, clicking anywhere on the header toggles the accordion.
   */
  onOpenPage?: () => void;
  children: React.ReactNode;
  locked?: boolean;
  /**
   * Static section: renders the normal completed pill (purple check + label)
   * but is non-interactive — no chevron, no toggle, no navigation.
   */
  readOnly?: boolean;
  /** Whether the collapsed pill shows a green check (complete) or empty ring. */
  complete?: boolean;
  /** When set (Details v2), the label becomes a hover target for the help box. */
  infoTipId?: DetailsInfoTipId;
}) {
  if (readOnly) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between rounded-full bg-white px-4 py-2.5 text-left">
          <span className="flex min-w-0 items-center gap-2.5">
            {complete ? (
              <SectionCheck />
            ) : (
              <span className="size-5 shrink-0 rounded-full border-2 border-divider" />
            )}
            {infoTipId ? (
              <InfoTarget
                tipId={infoTipId}
                className="truncate text-sm font-semibold text-deep-black"
              >
                {label}
              </InfoTarget>
            ) : (
              <span className="truncate text-sm font-semibold text-deep-black">
                {label}
              </span>
            )}
          </span>
          {/* Decorative-only chevron: present for visual parity, not interactive. */}
          <ChevronDown className="size-4 shrink-0 text-gray-2" strokeWidth={2} aria-hidden />
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between rounded-full bg-white/50 px-4 py-2.5 text-left opacity-60">
          <span className="flex items-center gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-divider text-gray-2">
              <Lock className="size-3" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-semibold text-gray-1">{label}</span>
          </span>
          <Lock className="size-4 shrink-0 text-gray-2" strokeWidth={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center justify-between rounded-full px-4 py-2.5 text-left transition-colors",
          active
            ? "bg-deep-black text-white"
            : "bg-white text-deep-black hover:bg-white/60",
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (onOpenPage) {
              onOpenPage();
              if (!open) onToggle();
            } else {
              onToggle();
            }
          }}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          {active ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-white">
              <span className="size-1.5 rounded-full bg-white" />
            </span>
          ) : complete ? (
            <SectionCheck />
          ) : (
            <span className="size-5 shrink-0 rounded-full border-2 border-divider" />
          )}
          {infoTipId ? (
            <InfoTarget
              tipId={infoTipId}
              interactive
              className="truncate text-sm font-semibold"
            >
              {label}
            </InfoTarget>
          ) : (
            <span className="truncate text-sm font-semibold">{label}</span>
          )}
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          className="shrink-0 rounded-full pl-2.5"
        >
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown
              className={cn("size-4 shrink-0", active ? "text-white" : "text-gray-2")}
              strokeWidth={2}
            />
          </motion.span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-1 rounded-b-card bg-white/60 px-4 pb-4 pt-3">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
