"use client";

import {
  Bike,
  BookOpen,
  Coffee,
  HeartHandshake,
  Music,
  Palette,
  Plane,
  Sprout,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface MoodItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const MOOD_ITEMS: MoodItem[] = [
  { id: "slow-mornings", label: "Slow mornings", icon: Coffee },
  { id: "grandkids", label: "Time with grandkids", icon: Users },
  { id: "travel", label: "Travel adventures", icon: Plane },
  { id: "active", label: "Staying active", icon: Bike },
  { id: "giving-back", label: "Giving back", icon: HeartHandshake },
  { id: "learning", label: "Learning new things", icon: BookOpen },
  { id: "nature", label: "Time in nature", icon: Sprout },
  { id: "creativity", label: "Creative projects", icon: Palette },
  { id: "music", label: "Music & culture", icon: Music },
];

export function MoodBoard({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid h-full grid-cols-2 gap-3 sm:grid-cols-3 sm:grid-rows-3">
      {MOOD_ITEMS.map((item) => {
        const isOn = selected.includes(item.id);
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(item.id)}
            className={cn(
              "group relative flex h-full min-h-[110px] flex-col items-center justify-center gap-3 rounded-card border-2 p-4 text-center transition-all",
              isOn
                ? "border-violet bg-violet/5"
                : "border-stroke-subtle bg-white hover:border-violet/40 hover:bg-ghost-white",
            )}
          >
            {isOn ? (
              <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-violet text-white">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
            ) : null}
            <Icon
              className={cn(
                "size-9 transition-colors",
                isOn ? "text-violet" : "text-gray-1",
              )}
              strokeWidth={1.75}
            />
            <span
              className={cn(
                "text-base font-medium",
                isOn ? "text-deep-black" : "text-gray-1",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
