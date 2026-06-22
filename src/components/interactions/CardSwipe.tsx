"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Check, CheckCheck, X, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Priority } from "@/lib/priorities";

export type SwipeVerdict = "essential" | "nice" | "skip";

export interface SwipeResult {
  /** Card ids ordered essential -> nice -> skip (highest to lowest priority). */
  ranking: string[];
  decisions: Record<string, SwipeVerdict>;
}

const VERDICTS: Record<
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
}: {
  items: Priority[];
  onComplete: (result: SwipeResult) => void;
  /** Notifies the parent when the deck has been fully sorted (results view). */
  onStatusChange?: (done: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, SwipeVerdict>>({});
  const [trigger, setTrigger] = useState<SwipeVerdict | null>(null);

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
      if (e.key === "ArrowLeft") setTrigger("skip");
      else if (e.key === "ArrowRight") setTrigger("nice");
      else if (e.key === "ArrowUp") setTrigger("essential");
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

  if (done) {
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
    <div className="flex w-full flex-col items-center">
      <ProgressBar current={index} total={items.length} />

      <div className="relative mt-7 h-[320px] w-full max-w-[360px] sm:h-[350px]">
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
              <div style={{ opacity: depth === 1 ? 0.85 : 0.45 }}>
                <CardFace priority={card} />
              </div>
            </div>
          );
        })}

        <SwipeCard
          key={current.id}
          priority={current}
          trigger={trigger}
          onCommitted={onCommitted}
        />
      </div>

      <div className="mt-7 flex items-center gap-3 sm:gap-4">
        <ActionButton verdict="skip" onClick={() => setTrigger("skip")} />
        <ActionButton verdict="essential" onClick={() => setTrigger("essential")} />
        <ActionButton verdict="nice" onClick={() => setTrigger("nice")} />
      </div>
      <p className="mt-4 text-center text-[12.5px] text-gray-2">
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
}: {
  priority: Priority;
  trigger: SwipeVerdict | null;
  onCommitted: (v: SwipeVerdict) => void;
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
      <CardFace priority={priority} />

      <Stamp style={{ opacity: essentialOpacity }} verdict="essential" position="top" />
      <Stamp style={{ opacity: niceOpacity }} verdict="nice" position="left" />
      <Stamp style={{ opacity: skipOpacity }} verdict="skip" position="right" />
    </motion.div>
  );
}

function CardFace({ priority }: { priority: Priority }) {
  const Icon = priority.icon;
  const isNeed = priority.category === "need";
  return (
    <div className="flex h-full flex-col p-7">
      <div className="flex items-center justify-between">
        <span
          className="grid size-12 place-items-center rounded-2xl"
          style={{
            background: isNeed ? "#f3e9fb" : "#fbe9f5",
            color: isNeed ? "#7f35b2" : "#c900ac",
          }}
        >
          <Icon size={24} strokeWidth={2.1} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-2">
          {isNeed ? "Need" : "Want"}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <h2
          className="m-0 text-[26px] font-bold leading-[1.12] text-deep-black sm:text-[28px]"
          style={{ letterSpacing: "-0.02em", textWrap: "balance" }}
        >
          {priority.title}
        </h2>
        <p className="mt-3 text-[15px] leading-[1.5] text-gray-1">
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
  const pct = current / total;
  return (
    <div className="flex w-full max-w-[380px] items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stroke-subtle">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-violet"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        />
      </div>
      <span className="min-w-[42px] text-right text-[13px] font-semibold tabular-nums text-gray-1">
        {current}/{total}
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
