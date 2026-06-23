"use client";

import { useEffect, useRef, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Bubble, Composer, TypingBubble } from "@/components/chat/ChatUI";
import { CardSort } from "@/components/interactions/CardSort";
import { BreakoutOverlay } from "@/components/interactions/BreakoutOverlay";
import {
  GOAL_PROMPTS,
  GOAL_SUGGESTIONS,
  buildGoalCards,
  findKeywords,
} from "@/lib/questions";
import type { GoalCard } from "@/lib/types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ack(text: string): string {
  const k = findKeywords(text)[0];
  const warm = ["Got it.", "Love that.", "That's helpful.", "Makes sense."];
  if (k) return `${cap(k)}, noted.`;
  return warm[text.length % warm.length];
}

function hasEnoughContext(allText: string, answered: number): boolean {
  const keywords = new Set(findKeywords(allText)).size;
  const words = allText.trim().split(/\s+/).filter(Boolean).length;
  if (answered >= GOAL_PROMPTS.length) return true;
  if (answered >= 2 && keywords >= 3) return true;
  if (answered >= 3 && keywords >= 2) return true;
  if (words >= 60) return true;
  return false;
}

export function ChatBreakoutGoalsScreen() {
  const { answers, setAnswers, appendMessage, goNext, goBack } = useFlow();
  const { goalsMessages: messages, goalsStage: stage, goalsText: draft } = answers;
  const [typing, setTyping] = useState(false);
  const [breakoutOpen, setBreakoutOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current && messages.length === 0) {
      seeded.current = true;
      setAnswers({
        goalsMessages: [
          { role: "bot", text: "Hi Gloria, this last part is the fun bit. The more you tell me, the better I can tailor your plan." },
          { role: "bot", text: GOAL_PROMPTS[0] },
        ],
        goalsStage: "asking",
      });
    }
  }, [messages.length, setAnswers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const botReply = (text: string, patch?: Partial<typeof answers>, delay = 850) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      appendMessage({ role: "bot", text });
      if (patch) setAnswers(patch);
    }, delay);
  };

  const composerActive = stage === "asking";
  const userCount = messages.filter((m) => m.role === "user").length;
  const suggestions = GOAL_SUGGESTIONS[Math.min(userCount, GOAL_SUGGESTIONS.length - 1)];

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text || !composerActive) return;

    const priorUserMsgs = messages.filter((m) => m.role === "user").map((m) => m.text);
    appendMessage({ role: "user", text });
    setAnswers({ goalsText: "" });

    const answered = priorUserMsgs.length + 1;
    const allText = [...priorUserMsgs, text].join(" ");

    if (hasEnoughContext(allText, answered)) {
      setAnswers({ goalCards: buildGoalCards(allText), goalsStage: "confirm" });
      botReply(
        "Love it, I've got a clear picture. Let's make it concrete: I'll pop open a quick card sort so you can drag your goals into the order that matters most.",
        undefined,
        900,
      );
      window.setTimeout(() => setBreakoutOpen(true), 1150);
    } else {
      botReply(`${ack(text)} ${GOAL_PROMPTS[answered]}`);
    }
  };

  const handleSend = () => submit(draft);

  const cards = answers.goalCards;
  const setCards = (next: GoalCard[]) => setAnswers({ goalCards: next });
  const addCard = (label: string) =>
    setCards([...cards, { id: `custom-${Date.now()}`, label, source: "custom" }]);

  const saveRanking = () => {
    setBreakoutOpen(false);
    const top = cards
      .slice(0, 3)
      .map((c, i) => `${i + 1}) ${c.label}`)
      .join("   ");
    setAnswers({ goalRanking: cards.map((c) => c.id) });
    botReply(
      `Perfect. Here's how you ranked things: ${top}. I'll weight your Bobcat plan around these.`,
      { goalsStage: "done" },
      600,
    );
  };

  return (
    <AppShell
      fill
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [{ label: "Required 80%", tone: "warning" }],
        subSections: [
          { label: "About You" },
          { label: "Assets" },
          { label: "Income" },
          { label: "Spending" },
          { label: "Goals", active: true },
        ],
      }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={goBack} />

        <h2 className="mt-6 text-2xl font-bold text-deep-black">Retirement Goals</h2>

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
          {composerActive ? (
            <Composer
              value={draft}
              onChange={(v) => setAnswers({ goalsText: v })}
              onSend={handleSend}
              suggestions={typing ? [] : suggestions}
              onSuggestionClick={submit}
            />
          ) : null}

          {stage === "done" && !typing ? (
            <div className="flex items-center justify-between gap-4">
              <Button variant="outline" size="md" onClick={() => setBreakoutOpen(true)}>
                Adjust ranking
              </Button>
              <Button variant="blue" size="md" onClick={goNext}>
                Finish up
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <BreakoutOverlay
        open={breakoutOpen}
        eyebrow="Card sort"
        title="Rank what matters most"
        subtitle="Drag your goals into order. Top of the list gets the most weight."
        onClose={() => setBreakoutOpen(false)}
        onSave={saveRanking}
        saveLabel="Save ranking"
        saveDisabled={cards.length === 0}
      >
        <CardSort cards={cards} onReorder={setCards} onAdd={addCard} />
      </BreakoutOverlay>
    </AppShell>
  );
}
