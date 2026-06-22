"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SCREENS, isStepId } from "@/components/flow/screens";
import { FIRST_STEP } from "@/lib/flow";

export default function StepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = use(params);
  const router = useRouter();
  const valid = isStepId(step);

  useEffect(() => {
    if (!valid) router.replace(`/${FIRST_STEP}`);
  }, [valid, router]);

  if (!valid) return null;

  const Screen = SCREENS[step];
  return <Screen />;
}
