"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { GoalCard } from "@/lib/types";

interface CardSortProps {
  cards: GoalCard[];
  onReorder: (cards: GoalCard[]) => void;
  onRemove?: (id: string) => void;
  onRename?: (id: string, label: string) => void;
  onAdd?: (label: string) => void;
  className?: string;
}

export function CardSort({
  cards,
  onReorder,
  onRemove,
  onRename,
  onAdd,
  className,
}: CardSortProps) {
  const [draft, setDraft] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(cards, oldIndex, newIndex));
  };

  const addCard = () => {
    const label = draft.trim();
    if (!label || !onAdd) return;
    onAdd(label);
    setDraft("");
  };

  const activeIndex = cards.findIndex((c) => c.id === activeId);
  const activeCard = activeIndex >= 0 ? cards[activeIndex] : null;

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {cards.map((card, i) => (
              <SortableRow
                key={card.id}
                card={card}
                rank={i + 1}
                dimmed={card.id === activeId}
                onRemove={onRemove}
                onRename={onRename}
              />
            ))}
          </ul>
        </SortableContext>

        <DragOverlay>
          {activeCard ? (
            <RowContent
              card={activeCard}
              rank={activeIndex + 1}
              dragging
              onRemove={onRemove}
              onRename={onRename}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {onAdd ? (
        <div className="flex items-center gap-2 rounded-card border border-dashed border-stroke-subtle bg-white px-4 py-2.5">
          <Plus className="size-5 shrink-0 text-gray-2" strokeWidth={2} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCard();
              }
            }}
            placeholder="Add your own goal…"
            className="w-full bg-transparent text-base text-deep-black outline-none placeholder:text-gray-2"
          />
          <button
            type="button"
            onClick={addCard}
            disabled={!draft.trim()}
            className="shrink-0 rounded-full bg-deep-black px-3 py-1 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            Add
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SortableRow({
  card,
  rank,
  dimmed,
  onRemove,
  onRename,
}: {
  card: GoalCard;
  rank: number;
  dimmed?: boolean;
  onRemove?: (id: string) => void;
  onRename?: (id: string, label: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={cn(dimmed && "opacity-0")}>
      <RowContent
        card={card}
        rank={rank}
        dragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onRemove={onRemove}
        onRename={onRename}
      />
    </li>
  );
}

function RowContent({
  card,
  rank,
  dragging,
  dragHandleProps,
  onRemove,
  onRename,
}: {
  card: GoalCard;
  rank: number;
  dragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  onRemove?: (id: string) => void;
  onRename?: (id: string, label: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-card border bg-white px-3 py-3",
        dragging
          ? "border-violet shadow-[0_8px_30px_rgba(16,24,32,0.12)]"
          : "border-stroke-subtle",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="shrink-0 cursor-grab touch-none text-gray-2 active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="size-5" strokeWidth={2} />
      </button>

      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet/10 text-sm font-semibold text-violet">
        {rank}
      </span>

      {onRename ? (
        <input
          value={card.label}
          onChange={(e) => onRename(card.id, e.target.value)}
          className="w-full bg-transparent text-base font-medium text-deep-black outline-none"
        />
      ) : (
        <span className="w-full text-base font-medium text-deep-black">
          {card.label}
        </span>
      )}

      {card.source !== "preset" ? (
        <span className="shrink-0 rounded-full bg-ghost-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-gray-2">
          {card.source === "chat" ? "From chat" : "Yours"}
        </span>
      ) : null}

      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${card.label}`}
          onClick={() => onRemove(card.id)}
          className="shrink-0 text-gray-2 transition-colors hover:text-deep-black"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
