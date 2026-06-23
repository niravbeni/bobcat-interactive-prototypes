"use client";

import { useEffect, useRef, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { MoneyField } from "@/components/ui/MoneyField";
import { EnterHint } from "@/components/ui/EnterHint";
import { Bubble, Composer, TypingBubble } from "@/components/chat/ChatUI";
import {
  INCOME_QUESTIONS,
  SPENDING_QUESTIONS,
  GOAL_PROMPTS,
  GOAL_SUGGESTIONS,
} from "@/lib/questions";
import type { QOption, QuestionDef } from "@/lib/questions";
import type { ChatMessage, SectionId } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Turn {
  section: SectionId;
  q: QuestionDef;
}

const TURNS: Turn[] = [
  ...INCOME_QUESTIONS.map((q) => ({ section: "income" as const, q })),
  ...SPENDING_QUESTIONS.map((q) => ({ section: "spending" as const, q })),
];

const GOAL_TURNS = 2;

type Mode = "options" | "money" | "goals" | "done";

export function LinearChatScreen() {
  const { answers, setAnswers, setQuestion, appendMessage, goNext, goBack } =
    useFlow();
  const messages = answers.goalsMessages;
  const [typing, setTyping] = useState(false);
  const [qi, setQi] = useState(0);
  const [mode, setMode] = useState<Mode>("options");
  const [pendingOption, setPendingOption] = useState<QOption | null>(null);
  const [moneyValue, setMoneyValue] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const [goalsAnswered, setGoalsAnswered] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  const questionText = (q: QuestionDef) =>
    [q.lead, q.highlight].filter(Boolean).join(" ") +
    (q.subtitle ? ` (${q.subtitle.toLowerCase()})` : "");

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const intro: ChatMessage[] = [
      {
        role: "bot",
        text: "Hi Gloria, let's build your plan together right here in chat. I'll ask a few quick questions, just tap or type your answers.",
      },
      { role: "bot", text: questionText(TURNS[0].q) },
    ];
    setAnswers({ goalsMessages: intro });
    setQi(0);
    setMode("options");
  }, [setAnswers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing, mode]);

  const botSay = (text: string, after?: () => void, delay = 700) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      appendMessage({ role: "bot", text });
      after?.();
    }, delay);
  };

  const advance = (nextIndex: number) => {
    if (nextIndex < TURNS.length) {
      setQi(nextIndex);
      botSay(questionText(TURNS[nextIndex].q), () => setMode("options"));
    } else {
      setMode("goals");
      botSay(GOAL_PROMPTS[0]);
    }
  };

  const pickOption = (opt: QOption) => {
    const { section, q } = TURNS[qi];
    setQuestion(section, q.id, { choice: opt.id });
    appendMessage({ role: "user", text: opt.label });

    if (opt.reveal === "money") {
      setPendingOption(opt);
      setMoneyValue(q.moneyDefault ?? "");
      setMode("money");
      botSay("Great, what amount should I use? (you can edit later)");
    } else {
      advance(qi + 1);
    }
  };

  const confirmMoney = () => {
    const { section, q } = TURNS[qi];
    setQuestion(section, q.id, { value: moneyValue });
    appendMessage({ role: "user", text: `$${moneyValue || "0"}` });
    setPendingOption(null);
    setMode("options");
    advance(qi + 1);
  };

  // Enter confirms the amount even if the field isn't focused. The field handles
  // its own Enter, so we skip when an input/textarea is focused (no double).
  useEffect(() => {
    if (mode !== "money" || typing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      confirmMoney();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typing, moneyValue, qi]);

  const sendGoal = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    appendMessage({ role: "user", text });
    setGoalDraft("");
    const answered = goalsAnswered + 1;
    setGoalsAnswered(answered);
    if (answered >= GOAL_TURNS) {
      setMode("done");
      botSay(
        "That's everything I need. I've saved your income, spending and goals, your Bobcat plan is ready to build on.",
      );
    } else {
      botSay(GOAL_PROMPTS[answered]);
    }
  };

  const current = TURNS[qi];
  const progressLabel =
    mode === "goals"
      ? "Your goals"
      : mode === "done"
        ? "All done"
        : `${current.section === "income" ? "Income" : "Spending"} · question ${qi + 1} of ${TURNS.length}`;

  return (
    <AppShell
      fill
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [{ label: "Required 60%", tone: "warning" }],
        subSections: [
          { label: "About You" },
          { label: "Income", active: mode !== "goals" && mode !== "done" },
          { label: "Spending" },
          { label: "Goals", active: mode === "goals" || mode === "done" },
        ],
      }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={goBack} />

        <h2 className="mt-6 text-2xl font-bold text-deep-black">
          Build your plan
        </h2>

        <div
          ref={scrollRef}
          className="scrollbar-slim mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 pr-1"
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.text}
            </Bubble>
          ))}
          {typing ? <TypingBubble /> : null}
        </div>

        <div className="mt-4 border-t border-stroke-subtle pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-gray-2">
            {progressLabel}
          </p>

          {mode === "options" && !typing ? (
            <div className="flex flex-wrap gap-2">
              {current.q.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pickOption(opt)}
                  className={cn(
                    "rounded-pill border border-ink bg-white px-5 py-3 text-base font-medium text-deep-black transition-colors hover:bg-deep-black hover:text-white",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}

          {mode === "money" && !typing ? (
            <div>
              <MoneyField
                value={moneyValue}
                onChange={setMoneyValue}
                onSubmit={confirmMoney}
                helper={pendingOption?.helper}
              />
              <div
                className={`${pendingOption?.helper ? "mt-2" : "mt-5"} flex items-center justify-start gap-3`}
              >
                <Button variant="blue" size="md" onClick={confirmMoney}>
                  Confirm
                </Button>
                <EnterHint />
              </div>
            </div>
          ) : null}

          {mode === "goals" && !typing ? (
            <Composer
              value={goalDraft}
              onChange={setGoalDraft}
              onSend={() => sendGoal(goalDraft)}
              suggestions={GOAL_SUGGESTIONS[Math.min(goalsAnswered, GOAL_SUGGESTIONS.length - 1)]}
              onSuggestionClick={sendGoal}
            />
          ) : null}

          {mode === "done" && !typing ? (
            <div className="flex items-center justify-end">
              <Button variant="blue" size="md" onClick={goNext}>
                Finish up
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
