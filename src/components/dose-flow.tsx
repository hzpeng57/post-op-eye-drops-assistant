"use client";

import { Check, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ActiveSession, ScheduleItem } from "@/types";

function formatCountdown(waitUntil: string, now: Date) {
  const seconds = Math.max(0, Math.ceil((new Date(waitUntil).getTime() - now.getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function DoseFlow({
  activeSession,
  item,
  now,
  onComplete
}: {
  activeSession: ActiveSession;
  item: ScheduleItem;
  now: Date;
  onComplete: () => void;
}) {
  const step = item.steps[activeSession.currentStepIndex];
  const stepNumber = activeSession.currentStepIndex + 1;

  if (!step) {
    return null;
  }

  if (activeSession.status === "waiting" && activeSession.waitUntil) {
    return (
      <div className="space-y-7 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-700">
          <Timer className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">等待下一种药</p>
          <p className="mt-2 text-6xl font-bold tabular-nums tracking-normal text-slate-950">
            {formatCountdown(activeSession.waitUntil, now)}
          </p>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-500">下一步</p>
          <p className="mt-1 text-2xl font-bold tracking-normal text-slate-950">
            {step.medicationName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 text-center">
      <p className="text-sm font-semibold text-slate-500">
        步骤 {stepNumber} / {item.steps.length}
      </p>
      <div>
        <p className="text-base font-semibold text-sky-700">当前药物</p>
        <h2 className="mt-2 text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
          {step.medicationName}
        </h2>
      </div>
      <Button size="lg" className="w-full" onClick={onComplete}>
        <Check className="h-6 w-6" />
        已滴完
      </Button>
    </div>
  );
}
