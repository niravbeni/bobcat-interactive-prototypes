"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { SIG_SPRING_SNAPPY } from "./shared";

/** The four Signature Outlook journey steps, in order (Figma 2165:32830). */
const STEPS = [
  "Current outlook",
  "New outlook",
  "Refine outlook",
  "Confirm with advisor",
] as const;

/**
 * Circular journey step indicator for the Signature Outlook sub-bar center.
 * Mirrors Figma's `StepTicks`: a done step is a filled grey dot with a white
 * check, the active step is a filled black dot with its number, and upcoming
 * steps are pale grey dots with a muted number + label.
 */
export function SignatureOutlookStepper({ active }: { active: number }) {
  return (
    <div className="flex items-center gap-6 px-3 py-2">
      {STEPS.map((label, i) => {
        const done = i < active;
        const isActive = i === active;
        return (
          <div key={label} className="flex shrink-0 items-center gap-2">
            <motion.span
              layout
              transition={SIG_SPRING_SNAPPY}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[13px] leading-none text-white",
                done && "bg-gray-1",
                isActive && "bg-black",
                !done && !isActive && "bg-[#e5e5e5]",
              )}
            >
              {done ? (
                <Check className="size-3" strokeWidth={3} />
              ) : (
                <span>{i + 1}</span>
              )}
            </motion.span>
            <span
              className={cn(
                "whitespace-nowrap text-[10px] uppercase leading-[16.5px] tracking-[0.66px]",
                isActive
                  ? "font-semibold text-black"
                  : done
                    ? "font-medium text-gray-1"
                    : "font-medium text-[#8a8a93]",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
