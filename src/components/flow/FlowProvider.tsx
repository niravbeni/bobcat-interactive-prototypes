"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  VARIANTS,
  firstStep,
  isVariantId,
  pathFor,
  type VariantId,
} from "@/lib/variants";
import {
  initialAnswers,
  type ChatMessage,
  type FlowAnswers,
  type QAnswer,
  type SectionId,
  type SpendingDetail,
  type StepId,
} from "@/lib/types";

interface FlowContextValue {
  variant: VariantId;
  step: StepId;
  steps: StepId[];
  stepIndex: number;
  answers: FlowAnswers;
  canGoBack: boolean;
  /** Current question index within each wizard section. */
  sectionIdx: Record<SectionId, number>;
  setSectionIdx: (section: SectionId, idx: number) => void;
  setAnswers: (patch: Partial<FlowAnswers>) => void;
  setQuestion: (
    section: SectionId,
    id: string,
    patch: Partial<QAnswer>,
    /** When `bump` is false the recency timestamp is preserved (e.g. for quick
     * slider nudges that shouldn't re-order the details panel). */
    opts?: { bump?: boolean },
  ) => void;
  setDetail: (patch: Partial<SpendingDetail>) => void;
  appendMessage: (msg: ChatMessage) => void;
  goNext: () => void;
  goBack: () => void;
  goTo: (step: StepId) => void;
  restart: () => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

/** Derive the active variant + step id from the current pathname. */
function locFromPath(pathname: string): { variant: VariantId; step: StepId } {
  const segs = pathname.split("/").filter(Boolean);
  if (segs[0] === "flows") {
    const variant = isVariantId(segs[1] ?? "") ? (segs[1] as VariantId) : "base";
    const steps = VARIANTS[variant].steps;
    const step = (segs[2] as StepId) ?? steps[0];
    return { variant, step: steps.includes(step) ? step : steps[0] };
  }
  const baseSteps = VARIANTS.base.steps;
  const step = (segs[0] as StepId) ?? baseSteps[0];
  return { variant: "base", step: baseSteps.includes(step) ? step : baseSteps[0] };
}

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [answers, setAnswersState] = useState<FlowAnswers>(initialAnswers);
  const [sectionIdx, setSectionIdxState] = useState<Record<SectionId, number>>({
    income: 0,
    spending: 0,
  });

  const { variant, step } = locFromPath(pathname);
  const steps = VARIANTS[variant].steps;
  const stepIndex = steps.indexOf(step);

  // Reset all answers whenever the active flow changes so data never leaks
  // between variants. The dashboard ("/") is neutral: leaving it marks the next
  // flow entry as fresh. Done during render (not an effect) so child screens
  // mount with already-cleared state and can seed correctly.
  const [trackedVariant, setTrackedVariant] = useState<VariantId | null>(null);
  const isDashboard = pathname === "/";
  if (isDashboard) {
    if (trackedVariant !== null) setTrackedVariant(null);
  } else if (trackedVariant !== variant) {
    setTrackedVariant(variant);
    setAnswersState(initialAnswers);
    setSectionIdxState({ income: 0, spending: 0 });
  }

  const setAnswers = useCallback((patch: Partial<FlowAnswers>) => {
    setAnswersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setQuestion = useCallback(
    (
      section: SectionId,
      id: string,
      patch: Partial<QAnswer>,
      opts?: { bump?: boolean },
    ) => {
      setAnswersState((prev) => {
        const prevAt = prev[section][id]?.at ?? Date.now();
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [id]: {
              ...prev[section][id],
              ...patch,
              at: opts?.bump === false ? prevAt : Date.now(),
            },
          },
        };
      });
    },
    [],
  );

  const setDetail = useCallback((patch: Partial<SpendingDetail>) => {
    setAnswersState((prev) => ({ ...prev, detail: { ...prev.detail, ...patch } }));
  }, []);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setAnswersState((prev) => ({
      ...prev,
      goalsMessages: [...prev.goalsMessages, msg],
    }));
  }, []);

  const setSectionIdx = useCallback((section: SectionId, idx: number) => {
    setSectionIdxState((prev) => ({ ...prev, [section]: idx }));
  }, []);

  const goNext = useCallback(() => {
    const next = steps[stepIndex + 1];
    if (next) router.push(pathFor(variant, next));
  }, [steps, stepIndex, variant, router]);

  const goBack = useCallback(() => {
    if (stepIndex <= 0) {
      router.push("/");
      return;
    }
    router.push(pathFor(variant, steps[stepIndex - 1]));
  }, [steps, stepIndex, variant, router]);

  const goTo = useCallback(
    (target: StepId) => {
      router.push(pathFor(variant, target));
    },
    [variant, router],
  );

  const restart = useCallback(() => {
    setAnswersState(initialAnswers);
    setSectionIdxState({ income: 0, spending: 0 });
    router.push(pathFor(variant, firstStep(variant)));
  }, [variant, router]);

  const value = useMemo<FlowContextValue>(
    () => ({
      variant,
      step,
      steps,
      stepIndex,
      answers,
      canGoBack: stepIndex > 0,
      sectionIdx,
      setSectionIdx,
      setAnswers,
      setQuestion,
      setDetail,
      appendMessage,
      goNext,
      goBack,
      goTo,
      restart,
    }),
    [
      variant,
      step,
      steps,
      stepIndex,
      answers,
      sectionIdx,
      setSectionIdx,
      setAnswers,
      setQuestion,
      setDetail,
      appendMessage,
      goNext,
      goBack,
      goTo,
      restart,
    ],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within a FlowProvider");
  return ctx;
}
