"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  OUTLOOK_INFO_TIPS,
  type OutlookInfoTipId,
} from "@/lib/outlookInfoTips";

interface InfoTipContextValue {
  activeId: OutlookInfoTipId | null;
  show: (id: OutlookInfoTipId) => void;
  clear: () => void;
}

const InfoTipContext = createContext<InfoTipContextValue | null>(null);

/**
 * Holds the currently-hovered tip so the bottom-of-sidebar box and every
 * hover target can share one source of truth. Mounted once in OutlookShell,
 * wrapping both the sidebar and the main content.
 */
export function OutlookInfoTipProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<OutlookInfoTipId | null>(null);
  const show = useCallback((id: OutlookInfoTipId) => setActiveId(id), []);
  const clear = useCallback(() => setActiveId(null), []);
  const value = useMemo(
    () => ({ activeId, show, clear }),
    [activeId, show, clear],
  );
  return (
    <InfoTipContext.Provider value={value}>{children}</InfoTipContext.Provider>
  );
}

function useOutlookInfoTip() {
  return useContext(InfoTipContext);
}

/**
 * Wraps a hoverable element (graph, highlighted term, sidebar control). On
 * hover/focus it fills the InfoTipBox with the matching definition; on
 * leave/blur it clears it. When `enabled` is false (or there is no provider)
 * it renders its children untouched, so non-v2 flows stay pristine.
 */
export function InfoTarget({
  tipId,
  as = "span",
  enabled = true,
  className,
  children,
}: {
  tipId: OutlookInfoTipId;
  as?: "span" | "div";
  enabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useOutlookInfoTip();
  const Tag = as;

  if (!ctx || !enabled) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={cn("cursor-help", className)}
      tabIndex={0}
      onMouseEnter={() => ctx.show(tipId)}
      onMouseLeave={() => ctx.clear()}
      onFocus={() => ctx.show(tipId)}
      onBlur={() => ctx.clear()}
    >
      {children}
    </Tag>
  );
}

/**
 * Persistent help panel pinned to the bottom of the sidebar (above the AI
 * input). Shows a subtle idle prompt until a target is hovered, then swaps in
 * that target's title + description with a soft fade.
 */
export function InfoTipBox() {
  const ctx = useOutlookInfoTip();
  const tip = ctx?.activeId ? OUTLOOK_INFO_TIPS[ctx.activeId] : null;

  return (
    <div className="flex min-h-[96px] flex-col rounded-card border border-stroke-subtle bg-white/80 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
        <Info className="size-3.5 text-violet" strokeWidth={2} />
        What is this?
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {tip ? (
          <motion.div
            key={ctx?.activeId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1.5"
          >
            <p className="text-xs font-semibold text-deep-black">{tip.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-gray-1">
              {tip.body}
            </p>
            {tip.advisor ? (
              <p className="mt-1 text-[11px] font-medium text-violet">
                Ask your advisor to learn more.
              </p>
            ) : null}
          </motion.div>
        ) : (
          <motion.p
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-[11px] leading-snug text-gray-2"
          >
            Hover over a chart or highlighted term to see what it means.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
