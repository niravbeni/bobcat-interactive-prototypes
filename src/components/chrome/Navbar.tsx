"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Info, SquareUser, FastForward, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { VARIANTS, SKIP_INTERACTION_EVENT } from "@/lib/variants";
import { cn } from "@/lib/cn";
import type { StepId } from "@/lib/types";

type V2TabId = "details" | "plan" | "marketplace";
const V2_TABS: { id: V2TabId; label: string; step: StepId }[] = [
  { id: "details", label: "Your Details", step: "details" },
  { id: "plan", label: "Your Outlook", step: "outlook" },
  { id: "marketplace", label: "Marketplace", step: "marketplace" },
];

export function Navbar() {
  const { variant, step, steps, stepIndex, goTo, answers, setAnswers } =
    useFlow();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isV2 = variant === "linear-chat-v2";

  // Which top-nav tab is highlighted, derived from the current step.
  const activeTab: V2TabId =
    step === "outlook"
      ? "plan"
      : step === "marketplace"
        ? "marketplace"
        : "details";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const skipTo = VARIANTS[variant].skipTo;
  const skipIndex = skipTo ? steps.indexOf(skipTo.step) : -1;
  const canSkip = !!skipTo && skipIndex > stepIndex;

  // In-flow skip: the interaction lives inside the current step, so we ask the
  // active screen to jump to it rather than navigating. The V2 chat owns this
  // interaction, so it's only offered while on the chat step.
  const skipInFlow = VARIANTS[variant].skipInFlow;
  const canFlowSkip = !!skipInFlow && step === "chat";
  const skipLabel = skipTo?.label ?? skipInFlow?.label;

  const handleSkip = () => {
    if (canSkip && skipTo) {
      goTo(skipTo.step);
    } else if (canFlowSkip) {
      window.dispatchEvent(new CustomEvent(SKIP_INTERACTION_EVENT));
    }
    setOpen(false);
  };

  return (
    <header className="relative flex h-18 w-full items-center bg-ghost-white px-9 3xl:h-20 3xl:px-14">
      <Link
        href="/"
        aria-label="Back to dashboard"
        className="inline-flex items-center text-deep-black transition-opacity hover:opacity-60"
      >
        <svg
          width="90"
          height="29"
          viewBox="0 0 90 29"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M90 5.70254L81.1742 28.4837H73.7419L70.0258 15.7617L66.2806 28.4837H58.8542L52.3277 11.4921H48.2632V19.1438C48.2632 22.7347 49.7148 23.3265 51.7006 23.3265C52.2268 23.316 52.7504 23.2499 53.2626 23.1292L55.2948 28.4199C53.7119 28.8074 52.0878 29.0022 50.4581 29C43.6529 29 40.7497 26.2212 40.7497 19.7181V11.4921H37.649L31.0703 28.4837H23.6381L19.9277 15.7617L16.171 28.4837H8.74452L0 5.70254H8.42516L12.8206 19.4687L17.0129 5.70254H22.8194L27.0523 19.4687L31.4245 5.70254H40.7497V1.60692L48.2632 0V5.70254H58.5348L62.9245 19.4687L67.1168 5.70254H72.9232L77.1561 19.4687L81.511 5.70254H90Z"
            fill="currentColor"
          />
        </svg>
      </Link>

      {isV2 ? (
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
          {V2_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const showDot =
              tab.id === "plan" &&
              answers.planRefreshed &&
              !answers.planPreviewSeen;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === "plan") setAnswers({ planPreviewSeen: true });
                  goTo(tab.step);
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-9 items-center rounded-full px-4 text-sm font-semibold tracking-[0.16px] transition-colors",
                  active
                    ? "bg-stratosphere text-white"
                    : "border border-stroke-subtle bg-white text-deep-black hover:bg-ghost-white",
                )}
              >
                {tab.label}
                {showDot ? (
                  <span
                    aria-label="Plan ready"
                    className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-success ring-2 ring-ghost-white"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[7px] rounded-xl px-3 py-1">
          <Info className="size-5 text-ink" strokeWidth={2} />
          <p className="text-sm font-medium leading-[1.4] tracking-[-0.42px] text-ink">
            Rough answers are fine, you&rsquo;ll refine and add more information later.{" "}
            <span className="underline">Learn more</span>
          </p>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button className="flex h-9 items-center gap-1 rounded-full bg-white pl-3 pr-2">
          <SquareUser className="size-6 text-black" strokeWidth={2} />
          <span className="text-base font-semibold tracking-[0.16px] text-black">Gloria</span>
          <ChevronDown className="size-6 text-black" strokeWidth={2} />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className="flex h-9 items-center justify-center rounded-full bg-deep-black px-4 transition-colors hover:bg-black"
          >
            <span className="text-base font-semibold tracking-[0.16px] text-white">Help</span>
          </button>

          {open ? (
            <div
              role="dialog"
              className="absolute right-0 top-[calc(100%+8px)] z-40 w-80 rounded-card border border-stroke-subtle bg-white p-4 shadow-[0_16px_48px_rgba(16,24,32,0.16)]"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-deep-black">
                  Need a hand?
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="-mr-1 -mt-1 rounded-full p-1 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>

              {(canSkip || canFlowSkip) && skipLabel ? (
                <>
                  <p className="mt-1 text-sm leading-[1.5] text-gray-1">
                    Short on time? Jump straight to{" "}
                    <span className="font-medium text-deep-black">
                      {skipLabel}
                    </span>
                    , the heart of this flow.
                  </p>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill bg-deep-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black"
                  >
                    <FastForward className="size-4" strokeWidth={2} />
                    Skip to {skipLabel}
                  </button>
                </>
              ) : (
                <p className="mt-1 text-sm leading-[1.5] text-gray-1">
                  This is a prototype. Rough answers are fine, you can refine
                  everything later.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
