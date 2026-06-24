"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export function CompleteScreen() {
  const { restart, goBack } = useFlow();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-deep-black px-6 text-center text-white">
      <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/40">
        Placeholder
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-[-0.02em]">Placeholder</h1>
      <p className="mt-4 max-w-md text-base text-white/50">
        This is where the rest of the app continues, comparing your current plan
        against Bobcat&rsquo;s lower-fee recommendation.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={goBack}
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
          Go back
        </Button>
        <Button variant="blue" size="lg" onClick={restart}>
          Start over
        </Button>
      </div>
    </div>
  );
}
