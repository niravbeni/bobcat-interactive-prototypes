"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VariantScreen } from "@/components/flow/variantScreens";
import { VARIANTS, isVariantId, firstStep } from "@/lib/variants";
import type { StepId } from "@/lib/types";

export default function VariantStepPage({
  params,
}: {
  params: Promise<{ variant: string; step: string }>;
}) {
  const { variant, step } = use(params);
  const router = useRouter();

  const validVariant = isVariantId(variant);
  const validStep =
    validVariant && VARIANTS[variant].steps.includes(step as StepId);

  useEffect(() => {
    if (!validVariant) {
      router.replace(`/${firstStep("base")}`);
    } else if (!validStep) {
      router.replace(`/flows/${variant}/${firstStep(variant)}`);
    }
  }, [validVariant, validStep, variant, router]);

  if (!validVariant || !validStep) return null;

  return <VariantScreen variant={variant} step={step as StepId} />;
}
