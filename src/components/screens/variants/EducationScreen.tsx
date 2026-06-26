"use client";

import { ArrowRight } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { useEnterToContinue } from "@/components/flow/useEnterToContinue";
import { AppShell } from "@/components/chrome/AppShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Card artwork using a standalone plant image. `grow` anchors it to the bottom
 * and scales it taller than the grey frame so it grows up and out of the box;
 * otherwise it sits centered and contained within the box.
 */
function PlantArt({
  standalone,
  grow = false,
}: {
  standalone: string;
  grow?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative h-32 w-full rounded-field bg-divider/40 sm:h-36 3xl:h-40",
        !grow && "overflow-hidden",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={standalone}
        alt=""
        className={cn(
          "pointer-events-none absolute left-1/2 w-auto max-w-none -translate-x-1/2 object-contain",
          grow ? "bottom-0 h-[132%]" : "inset-y-0 my-auto h-[80%]",
        )}
      />
    </div>
  );
}

interface EduCard {
  title: string;
  standalone: string;
  grow?: boolean;
  desc: string;
}

const CARDS: EduCard[] = [
  {
    title: "We gather your details",
    standalone: "/edu-sprout.png",
    desc: "A few basics about you, plus a rough estimate of your income and spending.",
  },
  {
    title: "See your full base plan",
    standalone: "/edu-plant2.png",
    grow: true,
    desc: "We crunch the numbers into a complete outlook — your base plan.",
  },
  {
    title: "Tweak & review",
    standalone: "/edu-tree.png",
    grow: true,
    desc: "Adjust your details and goals, then see how your outlook changes.",
  },
];

const NEEDS = [
  "A rough idea of your recent income",
  "Your savings & account balances",
  "Any pensions or Social Security details",
  "What matters most to you in retirement",
];

/**
 * Inexperienced-path (`hybrid-guided`) education page (Figma 671:8919): a
 * centered "Here's what will happen" explainer with three illustrated cards and
 * a "Here's what you'll need" checklist. Full-width like the persona picker —
 * "Get started" advances to the About madlib.
 */
export function EducationScreen() {
  const { goNext } = useFlow();

  // Single always-enabled "Get started" — this explainer is always complete.
  useEnterToContinue(true, goNext);

  return (
    <AppShell hideSidebar card={false}>
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-12 py-6 3xl:gap-16 3xl:py-8">
        <section className="flex w-full flex-col items-center gap-6">
          <h1 className="text-center text-2xl font-semibold tracking-[-0.01em] text-deep-black sm:text-3xl">
            Here&rsquo;s what will happen
          </h1>
          <div className="grid w-full max-w-[1040px] grid-cols-1 gap-5 md:grid-cols-3">
            {CARDS.map((card) => (
              <div
                key={card.title}
                className="flex flex-col gap-3 rounded-card bg-ghost-white p-5"
              >
                <PlantArt standalone={card.standalone} grow={card.grow} />
                <h2 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-deep-black">
                  {card.title}
                </h2>
                <p className="text-sm leading-snug text-gray-text">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-center text-lg font-semibold tracking-[-0.01em] text-deep-black sm:text-xl">
            Here&rsquo;s what you&rsquo;ll need
          </h2>
          <ul className="grid w-full max-w-[720px] grid-cols-1 gap-3 sm:grid-cols-2">
            {NEEDS.map((need) => (
              <li
                key={need}
                className="flex items-center gap-3 rounded-field bg-ghost-white px-4 py-2.5 text-sm font-medium text-deep-black"
              >
                <span className="size-2 shrink-0 rounded-full bg-violet" />
                {need}
              </li>
            ))}
          </ul>
        </section>

        <Button variant="primary" size="md" onClick={goNext}>
          Get started
          <ArrowRight className="size-5" strokeWidth={2} />
        </Button>
      </div>
    </AppShell>
  );
}
