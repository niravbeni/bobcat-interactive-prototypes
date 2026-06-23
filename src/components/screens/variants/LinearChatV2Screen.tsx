"use client";

import { useEffect, useRef, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { MoneyField } from "@/components/ui/MoneyField";
import { EnterHint } from "@/components/ui/EnterHint";
import { Bubble, Composer, TypingBubble } from "@/components/chat/ChatUI";
import { CardSort } from "@/components/interactions/CardSort";
import {
  INCOME_QUESTIONS,
  SPENDING_QUESTIONS,
  GOAL_PROMPTS,
  GOAL_SUGGESTIONS,
  buildGoalCards,
} from "@/lib/questions";
import { SKIP_INTERACTION_EVENT } from "@/lib/variants";
import type { QOption, QuestionDef } from "@/lib/questions";
import type { ChatMessage, GoalCard, SectionId } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Turn {
  section: SectionId;
  q: QuestionDef;
}

const TURNS: Turn[] = [
  ...INCOME_QUESTIONS.map((q) => ({ section: "income" as const, q })),
  ...SPENDING_QUESTIONS.map((q) => ({ section: "spending" as const, q })),
];

type Mode = "options" | "money" | "goals" | "rank" | "done";

/**
 * V2 of the linear chat flow. Same conversational onboarding, but when the chat
 * reaches the goals/priorities moment it brings the card-sort ranking inline
 * (no modal) so the user ranks what matters most without leaving the chat.
 */
export function LinearChatV2Screen() {
  const { answers, setAnswers, setQuestion, appendMessage, goNext, goBack } =
    useFlow();
  const messages = answers.goalsMessages;
  const cards = answers.goalCards;
  const [typing, setTyping] = useState(false);
  const [qi, setQi] = useState(0);
  const [mode, setMode] = useState<Mode>("options");
  const [pendingOption, setPendingOption] = useState<QOption | null>(null);
  const [moneyValue, setMoneyValue] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
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

  // Help → skip ahead to the goals chat (the lead-in just before ranking), so
  // the user answers one question and then naturally lands on the card sort.
  useEffect(() => {
    const onSkip = () => {
      setTyping(false);
      setQi(TURNS.length);
      appendMessage({
        role: "bot",
        text: "Sure, let's skip ahead to the part that matters most, your goals.",
      });
      setMode("goals");
      botSay(GOAL_PROMPTS[0]);
    };
    window.addEventListener(SKIP_INTERACTION_EVENT, onSkip);
    return () => window.removeEventListener(SKIP_INTERACTION_EVENT, onSkip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendMessage]);

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

  // One open question to gather context, then surface the goals as draggable
  // cards inline so the user can rank them right inside the chat.
  const sendGoal = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    appendMessage({ role: "user", text });
    setGoalDraft("");

    const priorUser = messages.filter((m) => m.role === "user").map((m) => m.text);
    const chatText = [...priorUser, text].join(" ");

    botSay(
      "Thanks. I've turned that into a set of goals below. Drag to rank what matters most, rename or remove any, then save.",
      () => {
        setAnswers({ goalCards: buildGoalCards(chatText).slice(0, 5) });
        setMode("rank");
      },
    );
  };

  const setCards = (next: GoalCard[]) => setAnswers({ goalCards: next });
  const renameCard = (id: string, label: string) =>
    setCards(cards.map((c) => (c.id === id ? { ...c, label } : c)));
  const removeCard = (id: string) => setCards(cards.filter((c) => c.id !== id));

  const saveRanking = () => {
    setAnswers({ goalRanking: cards.map((c) => c.id) });
    const top = cards[0]?.label;
    appendMessage({ role: "user", text: "Here's my ranking." });
    setMode("done");
    botSay(
      top
        ? `Perfect. I'll weight your plan around ${top.toLowerCase()} first, then the rest in order. That's everything I need, your Bobcat plan is ready to build on.`
        : "Perfect, that's everything I need. Your Bobcat plan is ready to build on.",
    );
  };

  const current = TURNS[qi];
  const progressLabel =
    mode === "goals"
      ? "Your goals"
      : mode === "rank"
        ? "Rank your goals"
        : mode === "done"
          ? "All done"
          : mode === "options"
            ? "Choose an option"
            : "";

  return (
    <AppShell
      fill
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [{ label: "Required 60%", tone: "warning" }],
        subSections: [
          { label: "About You" },
          { label: "Income", active: mode !== "goals" && mode !== "rank" && mode !== "done" },
          { label: "Spending" },
          { label: "Goals", active: mode === "goals" || mode === "rank" || mode === "done" },
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
          className="scrollbar-slim mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4 pr-3"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0, black 36px)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, black 36px)",
          }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.text}
            </Bubble>
          ))}
          {typing ? <TypingBubble /> : null}

          {/* The interaction lives inside the same scroll as the chat, so the
              whole thing reads as one continuous thread with a single scrollbar. */}
          {!typing ? (
            <div className="flex flex-col gap-3 border-t border-stroke-subtle pt-4">
              {progressLabel ? (
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-2">
                  {progressLabel}
                </p>
              ) : null}

              {mode === "options" ? (
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

              {mode === "money" ? (
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

              {mode === "goals" ? (
                <Composer
                  value={goalDraft}
                  onChange={setGoalDraft}
                  onSend={() => sendGoal(goalDraft)}
                  suggestions={GOAL_SUGGESTIONS[0]}
                  onSuggestionClick={sendGoal}
                />
              ) : null}

              {mode === "rank" ? (
                <div className="flex flex-col gap-3">
                  <CardSort
                    cards={cards}
                    onReorder={setCards}
                    onRename={renameCard}
                    onRemove={removeCard}
                  />
                  <div className="flex justify-start">
                    <Button
                      variant="blue"
                      size="md"
                      onClick={saveRanking}
                      disabled={cards.length === 0}
                    >
                      Save ranking
                    </Button>
                  </div>
                </div>
              ) : null}

              {mode === "done" ? (
                <div className="flex items-center justify-end">
                  <Button variant="blue" size="md" onClick={goNext}>
                    Finish up
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
