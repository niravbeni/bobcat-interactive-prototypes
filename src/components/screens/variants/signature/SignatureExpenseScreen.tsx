"use client";

import { ChevronLeft } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { SignatureShell, NavPill } from "./SignatureShell";
import { SignatureDetailsSidebar } from "./SignatureDetailsSidebar";

/**
 * Signature flow "Expense Engine" section. Intentionally a placeholder: it
 * mounts the shared shell + sidebar (Spending selected) so the flow and its
 * forward/back navigation are complete, but the main column is deliberately
 * blank while the interaction is still being designed.
 */
export function SignatureExpenseScreen() {
  const { goTo } = useFlow();

  return (
    <SignatureShell
      mode="tabs"
      scroll={false}
      askPill={false}
      subBar={{
        left: (
          <button
            type="button"
            onClick={() => goTo("sig-home")}
            className="inline-flex items-center gap-1 text-sm font-medium text-deep-black transition-opacity hover:opacity-60"
          >
            <ChevronLeft className="size-4" strokeWidth={2.2} />
            Back to summary
          </button>
        ),
        center: (
          <p className="text-xs text-[#18181b]">
            Your personalized outlook will update once we have more details in
            each category.
          </p>
        ),
        right: (
          <NavPill secondary="Goals" onClick={() => goTo("sig-goals")}>
            Next Section
          </NavPill>
        ),
      }}
      bodyClassName="p-4"
    >
      <div className="flex min-h-0 w-full flex-1 gap-4">
        <SignatureDetailsSidebar
          selected="spending"
          onNavigate={(section) => {
            if (section === "assets") goTo("sig-assets");
            else if (section === "goals") goTo("sig-goals");
          }}
        />

        {/* Intentionally blank main column — interaction still being designed. */}
        <div className="min-h-0 min-w-0 flex-1" />
      </div>
    </SignatureShell>
  );
}
