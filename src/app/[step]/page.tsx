"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VariantScreen } from "@/components/flow/variantScreens";
import { VARIANTS, firstStep } from "@/lib/variants";
import type { StepId } from "@/lib/types";

export default function StepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = use(params);
  const router = useRouter();
  const valid = VARIANTS.base.steps.includes(step as StepId);

  useEffect(() => {
    if (!valid) router.replace(`/${firstStep("base")}`);
  }, [valid, router]);

  if (!valid) return null;

  return <VariantScreen variant="base" step={step as StepId} />;
}
