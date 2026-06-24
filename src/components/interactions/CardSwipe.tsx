"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Check, CheckCheck, X, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Priority } from "@/lib/priorities";

export type SwipeVerdict = "essential" | "nice" | "skip";

export interface SwipeResult {
  /** Card ids ordered essential -> nice -> skip (highest to lowest priority). */
  ranking: string[];
  decisions: Record<string, SwipeVerdict>;
}

export const VERDICTS: Record<
  SwipeVerdict,
  { label: string; color: string; icon: LucideIcon }
> = {
  skip: { label: "Not for me", color: "#8b919a", icon: X },
  nice: { label: "Nice to have", color: "#c900ac", icon: Check },
  essential: { label: "Essential", color: "#7f35b2", icon: CheckCheck },
};

const SWIPE_X = 110;
const SWIPE_Y = 110;

export function CardSwipe({
  items,
  onComplete,
  onStatusChange,
  showResults = true,
  fit = false,
}: {
  items: Priority[];
  onComplete: (result: SwipeResult) => void;
  /** Notifies the parent when the deck has been fully sorted (results view). */
  onStatusChange?: (done: boolean) => void;
  /**
   * When false, skips the built-in results summary and fires `onComplete`
   * automatically once the deck is fully sorted. Defaults to true.
   */
  showResults?: boolean;
  /**
   * Make the deck fill available height (flex) instead of a fixed height, so
   * the swipe step fits a constrained screen without scrolling.
   */
  fit?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, SwipeVerdict>>({});
  const [trigger, setTrigger] = useState<SwipeVerdict | null>(null);
  const completedRef = useRef(false);

  const current = items[index];
  const done = index >= items.length;

  useEffect(() => {
    onStatusChange?.(done);
  }, [done, onStatusChange]);

  const onCommitted = useCallback(
    (verdict: SwipeVerdict) => {
      const card = items[index];
      if (card) setDecisions((d) => ({ ...d, [card.id]: verdict }));
      setTrigger(null);
      setIndex((i) => i + 1);
    },
    [index, items],
  );

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setTrigger("skip");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setTrigger("nice");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setTrigger("essential");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

  const reset = () => {
    setDecisions({});
    setTrigger(null);
    setIndex(0);
  };

  const grouped = useMemo(() => {
    const g: Record<SwipeVerdict, Priority[]> = {
      essential: [],
      nice: [],
      skip: [],
    };
    items.forEach((p) => {
      const v = decisions[p.id];
      if (v) g[v].push(p);
    });
    return g;
  }, [decisions, items]);

  useEffect(() => {
    if (showResults || !done || completedRef.current) return;
    completedRef.current = true;
    const ranking = [
      ...grouped.essential,
      ...grouped.nice,
      ...grouped.skip,
    ].map((p) => p.id);
    onComplete({ ranking, decisions });
  }, [showResults, done, grouped, decisions, onComplete]);

  if (done) {
    if (!showResults) return null;
    return (
      <Results
        grouped={grouped}
        onReset={reset}
        onContinue={() => {
          const ranking = [
            ...grouped.essential,
            ...grouped.nice,
            ...grouped.skip,
          ].map((p) => p.id);
          onComplete({ ranking, decisions });
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center",
        fit && "h-full min-h-0",
      )}
    >
      <ProgressBar current={index} total={items.length} />

      <div
        className={cn(
          "relative mt-2 w-full",
          fit
            ? "mb-7 max-w-[260px] min-h-[180px] max-h-[380px] flex-1"
            : "h-[320px] w-full max-w-[360px] sm:h-[350px]",
        )}
      >
        {[2, 1].map((depth) => {
          const card = items[index + depth];
          if (!card) return null;
          return (
            <div
              key={card.id}
              className="absolute inset-0 overflow-hidden rounded-[26px] border border-stroke-subtle bg-white shadow-[0_4px_12px_rgba(16,24,32,0.08)]"
              style={{
                transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.045})`,
                zIndex: 1,
              }}
            >
              <div className="h-full" style={{ opacity: depth === 1 ? 0.85 : 0.45 }}>
                <CardFace priority={card} compact={fit} />
              </div>
            </div>
          );
        })}

        <SwipeCard
          key={current.id}
          priority={current}
          trigger={trigger}
          onCommitted={onCommitted}
          compact={fit}
        />
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center gap-3 sm:gap-4",
          fit ? "mt-4" : "mt-7",
        )}
      >
        <ActionButton verdict="skip" onClick={() => setTrigger("skip")} />
        <ActionButton verdict="essential" onClick={() => setTrigger("essential")} />
        <ActionButton verdict="nice" onClick={() => setTrigger("nice")} />
      </div>
      <p className="mt-4 shrink-0 text-center text-[12.5px] text-gray-2">
        Swipe the card or use the buttons · ↑ essential · → nice to have · ← not
        for me
      </p>
    </div>
  );
}

function SwipeCard({
  priority,
  trigger,
  onCommitted,
  compact,
}: {
  priority: Priority;
  trigger: SwipeVerdict | null;
  onCommitted: (v: SwipeVerdict) => void;
  compact?: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-16, 0, 16]);

  const niceOpacity = useTransform(x, [40, 130], [0, 1]);
  const skipOpacity = useTransform(x, [-130, -40], [1, 0]);
  const essentialOpacity = useTransform(y, [-130, -40], [1, 0]);

  const flyOut = useCallback(
    (verdict: SwipeVerdict) => {
      const target =
        verdict === "nice"
          ? { x: 720, y: 40 }
          : verdict === "skip"
            ? { x: -720, y: 40 }
            : { x: 0, y: -820 };
      const opts = { duration: 0.36, ease: [0.32, 0, 0.2, 1] as const };
      animate(x, target.x, opts);
      animate(y, target.y, opts).then(() => onCommitted(verdict));
    },
    [x, y, onCommitted],
  );

  useEffect(() => {
    if (trigger) flyOut(trigger);
  }, [trigger, flyOut]);

  const handleDragEnd = useCallback(
    (
      _: unknown,
      info: { offset: { x: number; y: number }; velocity: { x: number; y: number } },
    ) => {
      const { offset, velocity } = info;
      if (offset.y < -SWIPE_Y || velocity.y < -750) {
        flyOut("essential");
      } else if (offset.x > SWIPE_X || velocity.x > 750) {
        flyOut("nice");
      } else if (offset.x < -SWIPE_X || velocity.x < -750) {
        flyOut("skip");
      } else {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 34 });
        animate(y, 0, { type: "spring", stiffness: 500, damping: 34 });
      }
    },
    [flyOut, x, y],
  );

  return (
    <motion.div
      drag
      dragElastic={0.6}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, zIndex: 5 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 440, damping: 34 }}
      className="absolute inset-0 cursor-grab touch-none select-none overflow-hidden rounded-[26px] border border-stroke-subtle bg-white shadow-[0_24px_48px_-16px_rgba(16,24,32,0.22)] active:cursor-grabbing"
    >
      <CardFace priority={priority} compact={compact} />

      <Stamp style={{ opacity: essentialOpacity }} verdict="essential" position="top" />
      <Stamp style={{ opacity: niceOpacity }} verdict="nice" position="left" />
      <Stamp style={{ opacity: skipOpacity }} verdict="skip" position="right" />
    </motion.div>
  );
}

function CardFace({
  priority,
  compact,
}: {
  priority: Priority;
  compact?: boolean;
}) {
  const Icon = priority.icon;
  const isNeed = priority.category === "need";
  return (
    <div className={cn("flex h-full flex-col", compact ? "p-6" : "p-7")}>
      <div className={cn("flex items-center", compact && "mt-auto")}>
        <span
          className={cn(
            "grid place-items-center",
            compact ? "size-11 rounded-xl" : "size-12 rounded-2xl",
          )}
          style={{
            background: isNeed ? "#f3e9fb" : "#fbe9f5",
            color: isNeed ? "#7f35b2" : "#c900ac",
          }}
        >
          <Icon size={compact ? 22 : 24} strokeWidth={2.1} />
        </span>
      </div>

      <div
        className={cn(
          "flex flex-col",
          compact ? "mb-auto mt-5 gap-2.5" : "flex-1 justify-center",
        )}
      >
        <h2
          className={cn(
            "m-0 font-bold leading-[1.12] text-deep-black",
            compact ? "text-[21px]" : "text-[26px] sm:text-[28px]",
          )}
          style={{ letterSpacing: "-0.02em" }}
        >
          {priority.title}
        </h2>
        <p
          className={cn(
            "leading-[1.5] text-gray-1",
            compact ? "text-[13.5px]" : "mt-3 text-[15px]",
          )}
        >
          {priority.question}
        </p>
      </div>
    </div>
  );
}

function Stamp({
  verdict,
  position,
  style,
}: {
  verdict: SwipeVerdict;
  position: "left" | "right" | "top";
  style: React.ComponentProps<typeof motion.div>["style"];
}) {
  const v = VERDICTS[verdict];
  const pos =
    position === "left"
      ? "left-6 top-1/2 -translate-y-1/2 -rotate-[14deg]"
      : position === "right"
        ? "right-6 top-1/2 -translate-y-1/2 rotate-[14deg]"
        : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
  return (
    <motion.div
      style={{ ...style, color: v.color, borderColor: v.color }}
      className={`pointer-events-none absolute ${pos} rounded-xl border-[3px] bg-white/85 px-3 py-1.5 text-[15px] font-extrabold uppercase tracking-wide backdrop-blur-sm`}
    >
      {v.label}
    </motion.div>
  );
}

function ActionButton({
  verdict,
  onClick,
}: {
  verdict: SwipeVerdict;
  onClick: () => void;
}) {
  const v = VERDICTS[verdict];
  const Icon = v.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={v.label}
      title={v.label}
      className="grid size-14 place-items-center rounded-full border bg-white shadow-[0_4px_12px_rgba(16,24,32,0.08)] transition-transform hover:-translate-y-0.5 active:scale-95"
      style={{ borderColor: v.color }}
    >
      <Icon size={24} strokeWidth={2.4} style={{ color: v.color }} />
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const position = Math.min(current + 1, total);
  return (
    <div className="mx-auto flex w-full max-w-[360px] justify-end">
      <span className="text-[12px] font-semibold tabular-nums text-gray-1">
        {position}
        <span className="text-gray-2"> / {total}</span>
      </span>
    </div>
  );
}

function Results({
  grouped,
  onReset,
  onContinue,
}: {
  grouped: Record<SwipeVerdict, Priority[]>;
  onReset: () => void;
  onContinue: () => void;
}) {
  const columns: { key: SwipeVerdict; tint: string }[] = [
    { key: "skip", tint: "#8b919a" },
    { key: "nice", tint: "#c900ac" },
    { key: "essential", tint: "#7f35b2" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[460px]"
    >
      <div className="text-center">
        <h2 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-deep-black sm:text-[24px]">
          All sorted, nice work.
        </h2>
        <p className="mx-auto mt-2 max-w-[400px] text-[13.5px] leading-[1.5] text-gray-1">
          Here&rsquo;s how your priorities landed. We&rsquo;ll show the full
          order next.
        </p>
      </div>

      <div className="relative mt-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[16%] top-[26px] h-[3px] rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #8b919a 0%, #c900ac 52%, #7f35b2 100%)",
            opacity: 0.45,
          }}
        />
        <div className="grid grid-cols-3 gap-3">
          {columns.map(({ key, tint }) => {
            const v = VERDICTS[key];
            const Icon = v.icon;
            const count = grouped[key].length;
            return (
              <div key={key} className="flex flex-col items-center gap-3">
                <div
                  className="relative z-[1] grid size-[52px] place-items-center rounded-full text-white shadow-[0_4px_12px_rgba(16,24,32,0.12)]"
                  style={{ background: tint }}
                >
                  <Icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <div
                    className="text-[13px] font-bold leading-tight"
                    style={{ color: tint }}
                  >
                    {v.label}
                  </div>
                  <div className="mt-0.5 text-[12px] font-semibold text-gray-2">
                    {count} {count === 1 ? "card" : "cards"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-ink bg-white px-5 py-2.5 text-[14px] font-semibold text-deep-black transition-colors hover:bg-ghost-white"
        >
          <RotateCcw size={16} strokeWidth={2.4} />
          Start over
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-full bg-stratosphere px-6 py-2.5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
