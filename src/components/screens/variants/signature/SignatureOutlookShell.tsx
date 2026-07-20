"use client";

import { ChevronLeft } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { OutlookSidebar } from "@/components/prototypes/outlook/OutlookSidebar";
import { OutlookFeedbackProvider } from "@/components/prototypes/outlook/OutlookFeedback";
import { OutlookInfoTipProvider } from "@/components/prototypes/outlook/OutlookInfoTip";
import { SignatureShell, NavPill } from "./SignatureShell";
import { SignatureOutlookStepper } from "./SignatureOutlookStepper";

/**
 * Shared chrome for the Signature Outlook screens (Plan Recommendation +
 * Risk-o-meter). Presents the reused Outlook sidebar/engine under Signature
 * top-nav chrome: the "Your Outlook" tab is active, the sub-bar carries a Back
 * link, the circular journey stepper and a black CTA pill, and the body is a
 * fixed sidebar + inner-scrolling main column (mirrors the aggregator screens
 * and OutlookShell's layout). Wraps the Outlook feedback + info-tip providers
 * exactly like OutlookShell so the reused sidebar behaves identically.
 */
export function SignatureOutlookShell({
  children,
  stage,
  cta,
  onCta,
  onBack,
  sidebarComplete = false,
  showStepper = false,
}: {
  children: React.ReactNode;
  /** Active journey stepper index, 0..3. */
  stage: number;
  cta: string;
  onCta: () => void;
  onBack: () => void;
  /** Collapsed refine-screen sidebar variant (all sections closed). */
  sidebarComplete?: boolean;
  /**
   * Show the four-step journey indicator (Current / New / Refine / Confirm) in
   * the sub-bar. Off by default: the Signature flow jumps straight to the New
   * Outlook (with the current-plan overlay) and has no standalone Current
   * Outlook / Confirm screens, so the four-step progress reads as misleading.
   */
  showStepper?: boolean;
}) {
  const { goTo } = useFlow();

  return (
    <OutlookFeedbackProvider>
      <SignatureShell
        mode="tabs"
        scroll={false}
        askPill={false}
        activeTab="Your Outlook"
        onSelectTab={(tab) => {
          if (tab === "Your Details") goTo("sig-home");
          else if (tab === "Your Outlook") goTo("sig-plan");
        }}
        subBar={{
          left: (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 text-sm font-medium text-deep-black transition-opacity hover:opacity-60"
            >
              <ChevronLeft className="size-4" strokeWidth={2.2} />
              Back
            </button>
          ),
          center: showStepper ? <SignatureOutlookStepper active={stage} /> : undefined,
          right: (
            <NavPill onClick={onCta} shape="rounded">
              {cta}
            </NavPill>
          ),
        }}
        bodyClassName="p-4"
      >
        <OutlookInfoTipProvider>
          <div className="flex min-h-0 w-full flex-1 gap-4">
            <OutlookSidebar complete={sidebarComplete} />
            <main className="scrollbar-slim relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-8 pr-1">
              {children}
            </main>
          </div>
        </OutlookInfoTipProvider>
      </SignatureShell>
    </OutlookFeedbackProvider>
  );
}
