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
  DETAILS_INFO_TIPS,
  type DetailsInfoTipId,
} from "@/lib/detailsInfoTips";

interface InfoTipContextValue {
  activeId: DetailsInfoTipId | null;
  show: (id: DetailsInfoTipId) => void;
  clear: () => void;
}

const InfoTipContext = createContext<InfoTipContextValue | null>(null);

/**
 * Holds the currently-hovered tip so the bottom-of-sidebar box and every
 * hover target can share one source of truth. Mounted in DetailsShell (v2
 * only), wrapping both the sidebar and the main content.
 */
export function DetailsInfoTipProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<DetailsInfoTipId | null>(null);
  const show = useCallback((id: DetailsInfoTipId) => setActiveId(id), []);
  const clear = useCallback(() => setActiveId(null), []);
  const value = useMemo(
    () => ({ activeId, show, clear }),
    [activeId, show, clear],
  );
  return (
    <InfoTipContext.Provider value={value}>{children}</InfoTipContext.Provider>
  );
}

function useDetailsInfoTip() {
  return useContext(InfoTipContext);
}

/**
 * Wraps a hoverable element (section header, value, highlighted term). On
 * hover/focus it fills the InfoTipBox with the matching definition; on
 * leave/blur it clears it. When there is no provider (the original Details
 * flow) or `enabled` is false, it renders its children untouched.
 */
export function InfoTarget({
  tipId,
  as = "span",
  enabled = true,
  interactive = false,
  className,
  children,
}: {
  tipId: DetailsInfoTipId;
  as?: "span" | "div";
  enabled?: boolean;
  /** Clickable control (button/select/etc.) — shows a pointer instead of help. */
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useDetailsInfoTip();
  const Tag = as;

  if (!ctx || !enabled) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={cn(
        interactive ? "cursor-pointer" : "cursor-help",
        className,
      )}
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
  const ctx = useDetailsInfoTip();
  const tip = ctx?.activeId ? DETAILS_INFO_TIPS[ctx.activeId] : null;
  const Icon = tip?.icon ?? Info;

  return (
    <motion.div
      layout
      transition={{ layout: { type: "spring", stiffness: 400, damping: 34 } }}
      className="flex min-h-[72px] flex-col rounded-card border border-stroke-subtle bg-white/80 px-3.5 py-3"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={ctx?.activeId ?? "idle"}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="flex"
          >
            <Icon className="size-3.5 text-violet" strokeWidth={2} />
          </motion.span>
        </AnimatePresence>
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
            Hover over a value or highlighted term to see what it means.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
