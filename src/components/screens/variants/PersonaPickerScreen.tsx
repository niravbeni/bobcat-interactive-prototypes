"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useEnterToContinue } from "@/components/flow/useEnterToContinue";
import { AppShell } from "@/components/chrome/AppShell";
import { Button } from "@/components/ui/Button";
import { FullscreenPlaceholder } from "@/components/v2/FullscreenPlaceholder";
import { pathFor } from "@/lib/variants";
import { cn } from "@/lib/cn";
import { SHOW_WTW } from "@/lib/brand";

type CardId = "card1" | "card2" | "card3";

interface PersonaCard {
  id: CardId;
  title: string;
}

const CARDS: PersonaCard[] = [
  { id: "card1", title: "See a draft outlook quickly, then add more detail" },
  { id: "card2", title: "Take some time to see a full outlook" },
  { id: "card3", title: "Talk to an advisor" },
];

/** Decorative "preview" lines hinting at the content behind each path. */
function CardLines({ selected }: { selected: boolean }) {
  const bar = cn(
    "h-1.5 rounded-full",
    selected ? "bg-white/40" : "bg-gray-2/40",
  );
  return (
    <div className="mt-5 flex flex-col gap-2.5">
      <div className="flex gap-2">
        <span className={cn(bar, "w-10")} />
        <span className={cn(bar, "w-12")} />
        <span className={cn(bar, "w-8")} />
        <span className={cn(bar, "w-12")} />
      </div>
      <div className="flex gap-2">
        <span className={cn(bar, "w-8")} />
        <span className={cn(bar, "w-16")} />
        <span className={cn(bar, "w-10")} />
      </div>
      <div className="flex gap-2">
        <span className={cn(bar, "w-12")} />
        <span className={cn(bar, "w-8")} />
      </div>
    </div>
  );
}

/**
 * Entry screen for the hybrid flow: pick how to build the retirement plan. Each
 * path is its own self-contained variant, so selecting one routes there (which
 * resets answers cleanly via the FlowProvider).
 */
export function PersonaPickerScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<CardId>("card1");
  const [advisorOpen, setAdvisorOpen] = useState(false);

  const handleContinue = () => {
    if (selected === "card1") {
      router.push(pathFor("hybrid-quick", "profile"));
    } else if (selected === "card2") {
      router.push(pathFor("hybrid-guided", "education"));
    } else {
      setAdvisorOpen(true);
    }
  };

  // A path is always selected, so Continue is always actionable. Disable Enter
  // while the advisor placeholder is open (it owns the foreground).
  useEnterToContinue(!advisorOpen, handleContinue);

  return (
    <AppShell hideSidebar card={false}>
      <div className="flex w-full flex-1 flex-col items-center justify-center py-10">
        <h1 className="text-center text-3xl font-semibold tracking-[-0.01em] text-deep-black">
          How would you like to create your retirement plan
        </h1>

        <div className="mt-12 grid w-full max-w-[1040px] grid-cols-1 gap-6 md:grid-cols-3">
          {CARDS.map((card) => {
            const isSelected = selected === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelected(card.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-[320px] flex-col rounded-card p-8 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet",
                  isSelected
                    ? "bg-violet text-white"
                    : "bg-ghost-white text-deep-black hover:bg-divider/60",
                )}
              >
                <div className="flex-1" />
                <h2 className="text-xl font-semibold leading-snug tracking-[-0.01em]">
                  {card.title}
                </h2>
                <CardLines selected={isSelected} />
              </button>
            );
          })}
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleContinue}
          className="mt-12"
        >
          Continue
          <ArrowRight className="size-5" strokeWidth={2} />
        </Button>
      </div>

      {advisorOpen ? (
        <FullscreenPlaceholder
          eyebrow="Talk to an advisor"
          title={SHOW_WTW ? "Talk to a WTW advisor" : "Talk to an advisor"}
          copy={
            SHOW_WTW
              ? "We're still designing this. You'll be able to find a time with a WTW retirement advisor right here, then pick up your plan whenever you're ready."
              : "We're still designing this. You'll be able to find a time with a retirement advisor right here, then pick up your plan whenever you're ready."
          }
          backLabel="Back"
          onClose={() => setAdvisorOpen(false)}
        />
      ) : null}
    </AppShell>
  );
}
