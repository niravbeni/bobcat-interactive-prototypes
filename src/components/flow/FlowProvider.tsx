"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FIRST_STEP, STEPS, previousStep } from "@/lib/flow";
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
  step: StepId;
  answers: FlowAnswers;
  canGoBack: boolean;
  /** Current question index within each wizard section. */
  sectionIdx: Record<SectionId, number>;
  setSectionIdx: (section: SectionId, idx: number) => void;
  setAnswers: (patch: Partial<FlowAnswers>) => void;
  setQuestion: (section: SectionId, id: string, patch: Partial<QAnswer>) => void;
  setDetail: (patch: Partial<SpendingDetail>) => void;
  appendMessage: (msg: ChatMessage) => void;
  goNext: () => void;
  goBack: () => void;
  goTo: (step: StepId) => void;
  restart: () => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

function stepFromPath(pathname: string): StepId {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && seg in STEPS ? (seg as StepId) : FIRST_STEP;
}

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [answers, setAnswersState] = useState<FlowAnswers>(initialAnswers);
  const [sectionIdx, setSectionIdxState] = useState<Record<SectionId, number>>({
    income: 0,
    spending: 0,
  });

  const step = stepFromPath(pathname);

  const setAnswers = useCallback((patch: Partial<FlowAnswers>) => {
    setAnswersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setQuestion = useCallback(
    (section: SectionId, id: string, patch: Partial<QAnswer>) => {
      setAnswersState((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [id]: { ...prev[section][id], ...patch },
        },
      }));
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
    const nextId = STEPS[step].next(answers);
    if (nextId) router.push(`/${nextId}`);
  }, [step, answers, router]);

  const goBack = useCallback(() => {
    const prev = previousStep(step);
    router.push(prev ? `/${prev}` : "/");
  }, [step, router]);

  const goTo = useCallback(
    (target: StepId) => {
      router.push(`/${target}`);
    },
    [router],
  );

  const restart = useCallback(() => {
    setAnswersState(initialAnswers);
    setSectionIdxState({ income: 0, spending: 0 });
    router.push(`/${FIRST_STEP}`);
  }, [router]);

  const value = useMemo<FlowContextValue>(
    () => ({
      step,
      answers,
      canGoBack: previousStep(step) !== null,
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
    [step, answers, sectionIdx, setSectionIdx, setAnswers, setQuestion, setDetail, appendMessage, goNext, goBack, goTo, restart],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within a FlowProvider");
  return ctx;
}
