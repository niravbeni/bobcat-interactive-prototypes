"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { LabeledMoneyField } from "@/components/ui/LabeledMoneyField";

export function SpendingDetail() {
  const { answers, setDetail } = useFlow();
  const d = answers.detail;

  return (
    <div className="mt-6 rounded-card border border-stroke-subtle bg-white p-6">
      <p className="text-lg font-semibold text-deep-black">Basic Needs</p>
      <div className="mt-4 flex flex-col gap-4">
        <LabeledMoneyField
          label="Monthly Housing Cost"
          value={d.housing}
          onChange={(v) => setDetail({ housing: v })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabeledMoneyField label="Food" value={d.food} onChange={(v) => setDetail({ food: v })} />
          <LabeledMoneyField
            label="Health Insurance"
            value={d.healthInsurance}
            onChange={(v) => setDetail({ healthInsurance: v })}
          />
          <LabeledMoneyField
            label="Transport"
            value={d.transport}
            onChange={(v) => setDetail({ transport: v })}
          />
          <LabeledMoneyField
            label="Travel"
            value={d.travel}
            onChange={(v) => setDetail({ travel: v })}
          />
        </div>
      </div>

      <p className="mt-8 text-lg font-semibold text-deep-black">Lifestyle</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabeledMoneyField
          label="Entertainment"
          value={d.entertainment}
          onChange={(v) => setDetail({ entertainment: v })}
        />
        <LabeledMoneyField
          label="Hobbies"
          value={d.hobbies}
          onChange={(v) => setDetail({ hobbies: v })}
        />
      </div>
    </div>
  );
}
