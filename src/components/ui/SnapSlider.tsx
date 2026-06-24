"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const THUMB_PX = 16; // diameter of the draggable handle
const SNAP_THRESHOLD = 6; // how close (in 0..100 units) before locking onto a key point

/** Position (0..100) → CSS left that keeps the thumb inside the padded track. */
const trackLeft = (v: number) =>
  `calc(${v}% + ${THUMB_PX / 2 - (v / 100) * THUMB_PX}px)`;

/**
 * A continuous draggable slider (0..100) with magnetic key points. Dragging is
 * smooth and incremental, but the handle gently locks onto a key point when it
 * gets close. Every change is reported immediately so consumers update live.
 */
export function SnapSlider({
  value,
  snapPoints,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  snapPoints: number[];
  onChange: (v: number) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const inset = THUMB_PX / 2;
    const usable = Math.max(1, rect.width - THUMB_PX);
    const raw = ((clientX - rect.left - inset) / usable) * 100;
    let next = Math.min(100, Math.max(0, raw));
    const snap = snapPoints.find((p) => Math.abs(p - next) <= SNAP_THRESHOLD);
    if (snap !== undefined) next = snap;
    onChange(Math.round(next));
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => setFromClientX(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const step = (delta: number) => {
    if (delta < 0) {
      const prev = [...snapPoints].reverse().find((p) => p < value);
      onChange(prev ?? snapPoints[0]);
    } else {
      const next = snapPoints.find((p) => p > value);
      onChange(next ?? snapPoints[snapPoints.length - 1]);
    }
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
      onPointerDown={(e) => {
        setDragging(true);
        setFromClientX(e.clientX);
      }}
      className={cn(
        "relative flex h-5 cursor-pointer items-center touch-none select-none",
        className,
      )}
    >
      {/* Track + glow live in a wrapper clipped to the exact track bounds, so the
          fade never leaks past the rounded ends. The 8px inset equals the thumb
          radius, so a value of 0..100 maps linearly to 0..100% of the wrapper. */}
      <div className="pointer-events-none absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-divider">
        <div
          className="absolute top-1/2 h-1 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${value}%`,
            background:
              "linear-gradient(to right, transparent, rgba(50,127,239,0.55), transparent)",
          }}
        />
      </div>
      {snapPoints.map((p) => (
        <span
          key={p}
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-2 bg-white"
          style={{ left: trackLeft(p) }}
        />
      ))}
      <span
        className="pointer-events-none absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-stratosphere shadow-[0_1px_3px_rgba(16,24,32,0.25)]"
        style={{ left: trackLeft(value) }}
      />
    </div>
  );
}
