"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Armchair,
  Gift,
  HeartPulse,
  Home,
  RotateCcw,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OUTLOOK_EVENTS, type OutlookEvent } from "@/lib/outlook";
import { cn } from "@/lib/cn";

/** Resolve the catalog's icon-name strings to lucide components. */
const ICONS: Record<string, LucideIcon> = {
  TrendingDown,
  TrendingUp,
  Gift,
  Stethoscope,
  Home,
  Armchair,
  HeartPulse,
};

const POPOVER_WIDTH = 272;
const POPOVER_MAX_HEIGHT = 400;

/** Animated on/off switch (visual only — the whole row is the button). */
function Toggle({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "relative flex h-[18px] w-8 shrink-0 items-center rounded-full px-[3px] transition-colors",
        active ? "bg-violet" : "bg-divider",
      )}
    >
      <motion.span
        className="size-3 rounded-full bg-white shadow-sm"
        animate={{ x: active ? 13 : 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
      />
    </span>
  );
}

/** A single compact toggleable event row. */
function EventRow({
  event,
  active,
  onToggle,
}: {
  event: OutlookEvent;
  active: boolean;
  onToggle: () => void;
}) {
  const Icon = ICONS[event.icon] ?? Gift;
  const up = event.direction === "up";
  const Dir = up ? ArrowUpRight : ArrowDownRight;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
        active ? "bg-violet/[0.07]" : "hover:bg-ghost-white",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
          active ? "bg-violet text-white" : "bg-ghost-white text-gray-1",
        )}
      >
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-[12px] font-semibold text-deep-black">
            {event.label}
          </span>
          <Dir
            className={cn("size-3 shrink-0", up ? "text-success" : "text-gray-2")}
            strokeWidth={2.5}
          />
        </span>
        <span className="text-[10px] text-gray-2">Age {event.age}</span>
      </span>
      <Toggle active={active} />
    </button>
  );
}

/**
 * Compact "Model custom events" popover, anchored beside its trigger button.
 * Toggling events writes to the shared outlook state, so every chart and
 * headline on the page recomputes live behind the popover — no in-popover
 * preview needed.
 */
export function CustomEventsModal({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
}) {
  const { answers, setOutlook } = useFlow();
  const { customEvents } = answers.outlook;

  const [pos, setPos] = useState<{
    top: number;
    left: number;
    arrowTop: number;
    side: "left" | "right";
  } | null>(null);

  const toggle = (id: string) => {
    const next = customEvents.includes(id)
      ? customEvents.filter((e) => e !== id)
      : [...customEvents, id];
    setOutlook({ customEvents: next });
  };

  const clearAll = () => setOutlook({ customEvents: [] });

  // Position the popover next to the trigger, flipping to the left edge if it
  // would overflow, and clamping vertically to stay on-screen.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const margin = 12;
      let side: "left" | "right" = "right";
      let left = r.right + margin;
      if (left + POPOVER_WIDTH > window.innerWidth - 8) {
        left = r.left - margin - POPOVER_WIDTH;
        side = "left";
      }
      left = Math.max(8, left);
      const top = Math.max(
        8,
        Math.min(
          r.top + r.height / 2 - POPOVER_MAX_HEIGHT / 2,
          window.innerHeight - 8 - POPOVER_MAX_HEIGHT,
        ),
      );
      const arrowTop = Math.min(
        POPOVER_MAX_HEIGHT - 24,
        Math.max(16, r.top + r.height / 2 - top),
      );
      setPos({ top, left, arrowTop, side });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Surface the two most relevant events per category, then present them as one
  // list sorted by direction — all the "up" (positive) events first, then the
  // "down" (negative) ones.
  const relevant = [
    ...OUTLOOK_EVENTS.filter((e) => e.category === "market").slice(0, 2),
    ...OUTLOOK_EVENTS.filter((e) => e.category === "life").slice(0, 2),
  ];
  const ordered = [...relevant].sort((a, b) =>
    a.direction === b.direction ? 0 : a.direction === "up" ? -1 : 1,
  );
  const count = customEvents.length;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && pos ? (
        <>
          {/* Transparent click-catcher — no dim, so the charts stay visible. */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="fixed inset-0 z-[65] cursor-default"
          />
          <motion.div
            role="dialog"
            aria-label="Model custom events"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: POPOVER_WIDTH,
              maxHeight: POPOVER_MAX_HEIGHT,
              transformOrigin: pos.side === "right" ? "left center" : "right center",
            }}
            className="z-[66] flex flex-col overflow-hidden rounded-card border border-stroke-subtle bg-white shadow-[0_18px_50px_rgba(16,24,32,0.22)]"
          >
            {/* Little pointer arrow toward the trigger button. */}
            <span
              aria-hidden
              style={{ top: pos.arrowTop }}
              className={cn(
                "absolute size-3 rotate-45 border bg-white",
                pos.side === "right"
                  ? "-left-1.5 border-b-0 border-r-0 border-stroke-subtle"
                  : "-right-1.5 border-l-0 border-t-0 border-stroke-subtle",
              )}
            />

            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-divider px-3 py-2.5">
              <p className="text-[13px] font-semibold text-deep-black">
                Model custom events
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Event list — ups on top, downs on the bottom, one flat list. */}
            <div className="scrollbar-slim flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
              {ordered.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  active={customEvents.includes(e.id)}
                  onToggle={() => toggle(e.id)}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-divider px-3 py-2">
              <span className="text-[10px] font-medium text-gray-1">
                {count === 0
                  ? "No events applied"
                  : `${count} applied`}
              </span>
              <button
                type="button"
                onClick={clearAll}
                disabled={count === 0}
                className={cn(
                  "flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors",
                  count === 0
                    ? "cursor-not-allowed text-gray-2"
                    : "text-deep-black hover:bg-ghost-white",
                )}
              >
                <RotateCcw className="size-3" strokeWidth={2} />
                Clear all
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
