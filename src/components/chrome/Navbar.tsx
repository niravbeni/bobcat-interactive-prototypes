"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Info, SquareUser, FastForward, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { VARIANTS, SKIP_INTERACTION_EVENT } from "@/lib/variants";

export function Navbar() {
  const { variant, steps, stepIndex, goTo } = useFlow();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
  // active screen to jump to it rather than navigating.
  const skipInFlow = VARIANTS[variant].skipInFlow;
  const canFlowSkip = !!skipInFlow && stepIndex === 0;
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
        className="text-2xl leading-none tracking-[-1.8px] text-black transition-opacity hover:opacity-60"
      >
        WTW
      </Link>

      <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[7px] rounded-xl px-3 py-1">
        <Info className="size-5 text-ink" strokeWidth={2} />
        <p className="text-sm font-medium leading-[1.4] tracking-[-0.42px] text-ink">
          Rough answers are fine, you&rsquo;ll refine and add more information later.{" "}
          <span className="underline">Learn more</span>
        </p>
      </div>

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
            className="flex h-9 items-center justify-center rounded-full bg-violet px-4"
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
