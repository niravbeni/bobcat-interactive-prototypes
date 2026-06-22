"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export function CompleteScreen() {
  const { restart, goBack } = useFlow();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-deep-black px-6 text-center text-white">
      <button
        type="button"
        onClick={goBack}
        className="absolute left-8 top-8 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-5" strokeWidth={2} />
        Back
      </button>

      <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/40">
        Placeholder
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-[-0.02em]">Placeholder</h1>
      <p className="mt-4 max-w-md text-base text-white/50">
        This is where the rest of the app continues, comparing your current plan
        against Bobcat&rsquo;s lower-fee recommendation.
      </p>

      <Button variant="blue" size="lg" className="mt-10" onClick={restart}>
        Start over
      </Button>
    </div>
  );
}
