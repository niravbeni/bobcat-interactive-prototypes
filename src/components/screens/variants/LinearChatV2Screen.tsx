"use client";

import { useEffect, useRef, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { DetailsSidebar } from "@/components/chrome/DetailsSidebar";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { MoneyField } from "@/components/ui/MoneyField";
import { EnterHint } from "@/components/ui/EnterHint";
import { Bubble, Composer, TypingBubble } from "@/components/chat/ChatUI";
import { CardSort } from "@/components/interactions/CardSort";
import { PlanPreviewModal } from "@/components/v2/PlanPreviewModal";
import { TabPlaceholder } from "@/components/v2/TabPlaceholder";
import {
  INCOME_QUESTIONS,
  SPENDING_QUESTIONS,
  GOAL_PROMPTS,
  GOAL_SUGGESTIONS,
  MANDATORY_QIDS,
  buildGoalCards,
} from "@/lib/questions";
import { SKIP_INTERACTION_EVENT } from "@/lib/variants";
import type { QOption, QuestionDef } from "@/lib/questions";
import type { ChatMessage, GoalCard, SectionId } from "@/lib/types";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { ArrowUp, CheckCircle2 } from "lucide-react";

interface Turn {
  section: SectionId;
  q: QuestionDef;
}

const TURNS: Turn[] = [
  ...INCOME_QUESTIONS.map((q) => ({ section: "income" as const, q })),
  ...SPENDING_QUESTIONS.map((q) => ({ section: "spending" as const, q })),
];

type Mode = "options" | "money" | "checkpoint" | "goals" | "rank" | "done";

const CHECKPOINT_OPTIONS = [
  { id: "continue", label: "Yes, let's keep going" },
  { id: "preview", label: "See my updated plan first" },
];

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
  const [scrolled, setScrolled] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askDraft, setAskDraft] = useState("");
  const [resumeIdx, setResumeIdx] = useState<number | null>(null);
  const [planPreviewOpen, setPlanPreviewOpen] = useState(false);
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
  }, [messages, typing, mode, askOpen]);

  // Whenever the user moves forward in the flow (new question, new mode), close
  // any open ask-a-question composer so it doesn't linger across steps. This is
  // a small UI reset, intentionally driven from a sync effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setAskOpen(false);
    setAskDraft("");
  }, [qi, mode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const botSay = (text: string, after?: () => void, delay = 700) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      appendMessage({ role: "bot", text });
      after?.();
    }, delay);
  };

  const askQuestion = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    appendMessage({ role: "user", text });
    setAskDraft("");
    setAskOpen(false);
    botSay(
      "Good question — I'll come back to that in a moment. For now, pick one of the options above and we'll keep moving.",
    );
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

  /**
   * True when answering question `qId` completes the full mandatory set for the
   * first time. Uses live `answers` plus the just-answered id (because the
   * setQuestion state update is async).
   */
  const completesMandatorySet = (qId: string) => {
    if (answers.planRefreshed) return false;
    if (!MANDATORY_QIDS.has(qId)) return false;
    const answered = new Set<string>(
      [
        ...Object.entries(answers.income).filter(([, a]) => a.choice).map(
          ([k]) => k,
        ),
        ...Object.entries(answers.spending).filter(([, a]) => a.choice).map(
          ([k]) => k,
        ),
        qId,
      ],
    );
    for (const id of MANDATORY_QIDS) {
      if (!answered.has(id)) return false;
    }
    return true;
  };

  /**
   * Drop the inline "Plan Updated" pill into the chat, flip the refreshed flag
   * (so the sidebar and nav dot update), and offer the user a choice between
   * continuing and previewing the plan.
   */
  const triggerMilestone = (nextIdx: number) => {
    appendMessage({
      role: "bot",
      kind: "pill",
      text: "Plan Updated",
      pill: { label: "Plan Updated" },
    });
    setAnswers({ planRefreshed: true });
    setResumeIdx(nextIdx);
    botSay(
      "Okay we've covered all the mandatory information. Do you want to improve the accuracy of your plan by answering some optional questions?",
      () => setMode("checkpoint"),
    );
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
    } else if (completesMandatorySet(q.id)) {
      triggerMilestone(qi + 1);
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
    if (completesMandatorySet(q.id)) {
      triggerMilestone(qi + 1);
    } else {
      advance(qi + 1);
    }
  };

  const pickCheckpoint = (optionId: string) => {
    const opt = CHECKPOINT_OPTIONS.find((o) => o.id === optionId);
    if (!opt) return;
    appendMessage({ role: "user", text: opt.label });
    if (optionId === "continue") {
      const next = resumeIdx ?? qi + 1;
      setResumeIdx(null);
      advance(next);
    } else {
      // Stay in checkpoint mode so the user can still pick "Yes, let's keep
      // going" after closing the preview.
      setAnswers({ planPreviewSeen: true });
      setPlanPreviewOpen(true);
    }
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

  return (
    <AppShell
      fill
      customSidebar={
        <DetailsSidebar
          onOpenPreview={() => {
            setAnswers({ planPreviewSeen: true });
            setPlanPreviewOpen(true);
          }}
        />
      }
    >
      {answers.v2ActiveTab === "plan" ? (
        <TabPlaceholder
          title="Your plan will live here"
          copy="We're still designing this view. It'll show your forecast, priorities, and what to refine next."
        />
      ) : answers.v2ActiveTab === "marketplace" ? (
        <TabPlaceholder
          title="Marketplace coming soon"
          copy="Browse curated products and services that fit your plan. This is a placeholder while we design the real experience."
        />
      ) : (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={goBack} label="All details" size={36} />

        <div
          ref={scrollRef}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
          className="scrollbar-slim mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4 pr-3"
          style={
            scrolled
              ? {
                  maskImage:
                    "linear-gradient(to bottom, transparent 0, black 36px)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0, black 36px)",
                }
              : undefined
          }
        >
          {messages.map((m, i) =>
            m.kind === "pill" ? (
              <div key={i} className="flex">
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-sm font-medium text-deep-black shadow-[0_1px_2px_rgba(16,24,32,0.06)]">
                  {m.pill?.label ?? m.text}
                  <CheckCircle2
                    className="size-4 text-success"
                    strokeWidth={2}
                  />
                </span>
              </div>
            ) : (
              <Bubble key={i} role={m.role}>
                {m.text}
              </Bubble>
            ),
          )}
          {typing ? <TypingBubble /> : null}

          {/* The interaction lives inside the same scroll as the chat, so the
              whole thing reads as one continuous thread with a single scrollbar. */}
          {!typing ? (
            <div className="flex flex-col gap-3 pt-2">
              {mode === "options" ? (
                <div className="flex flex-col gap-3">
                  <div className="overflow-hidden rounded-card bg-white p-1">
                    {current.q.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => pickOption(opt)}
                        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-base text-deep-black transition-colors hover:bg-divider/60"
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>

                  {askOpen ? (
                    <div className="flex items-center gap-2 rounded-card border border-stroke-subtle bg-white px-3 py-2">
                      <AskSendIcon className="size-6 shrink-0" />
                      <input
                        autoFocus
                        value={askDraft}
                        onChange={(e) => setAskDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            askQuestion(askDraft);
                          } else if (e.key === "Escape") {
                            setAskOpen(false);
                            setAskDraft("");
                          }
                        }}
                        placeholder="Type your question…"
                        className="flex-1 bg-transparent text-sm text-deep-black outline-none placeholder:text-gray-text"
                      />
                      <button
                        type="button"
                        onClick={() => askQuestion(askDraft)}
                        aria-label="Send question"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                        disabled={!askDraft.trim()}
                      >
                        <ArrowUp className="size-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAskOpen(true)}
                      className="flex items-center gap-2 self-start text-sm font-medium text-violet transition-opacity hover:opacity-80"
                    >
                      <AskSendIcon className="size-5" />
                      Ask a question
                    </button>
                  )}
                </div>
              ) : null}

              {mode === "checkpoint" ? (
                <div className="overflow-hidden rounded-card bg-white p-1">
                  {CHECKPOINT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => pickCheckpoint(opt.id)}
                      className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-base text-deep-black transition-colors hover:bg-divider/60"
                    >
                      <span>{opt.label}</span>
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
                <div className="flex flex-col gap-3">
                  <div className="overflow-hidden rounded-card bg-white p-1">
                    {GOAL_SUGGESTIONS[0].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => sendGoal(s)}
                        className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-base text-deep-black transition-colors hover:bg-divider/60"
                      >
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                  <Composer
                    value={goalDraft}
                    onChange={setGoalDraft}
                    onSend={() => sendGoal(goalDraft)}
                  />
                </div>
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
      )}

      {planPreviewOpen ? (
        <PlanPreviewModal onClose={() => setPlanPreviewOpen(false)} />
      ) : null}
    </AppShell>
  );
}
