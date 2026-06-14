import type { ActiveSession, DailyPlan, DoseRecord, ScheduleItem } from "@/types";

export interface CurrentScheduleFocus {
  readyItem: ScheduleItem | null;
  nextItem: ScheduleItem | null;
  missedItemIds: string[];
  missedStepCount: number;
}

export function stepIsCompleted(stepId: string, records: DoseRecord[]) {
  return records.some((record) => record.scheduleStepId === stepId && record.status === "completed");
}

export function itemIsCompleted(item: ScheduleItem, records: DoseRecord[]) {
  return item.steps.every((step) => stepIsCompleted(step.id, records));
}

export function selectCurrentScheduleFocus({
  dailyPlan,
  records,
  now
}: {
  dailyPlan: DailyPlan;
  records: DoseRecord[];
  now: Date;
}): CurrentScheduleFocus {
  const nowTime = now.getTime();
  const dueItems = dailyPlan.items.filter(
    (item) => new Date(item.scheduledAt).getTime() <= nowTime
  );
  const latestDueItem = dueItems.at(-1) ?? null;
  const readyItem =
    latestDueItem && !itemIsCompleted(latestDueItem, records) ? latestDueItem : null;
  const nextItem =
    dailyPlan.items.find(
      (item) => new Date(item.scheduledAt).getTime() > nowTime && !itemIsCompleted(item, records)
    ) ?? null;
  const missedItems = dueItems.filter(
    (item) => item.id !== readyItem?.id && !itemIsCompleted(item, records)
  );

  return {
    readyItem,
    nextItem,
    missedItemIds: missedItems.map((item) => item.id),
    missedStepCount: missedItems.reduce((total, item) => total + item.steps.length, 0)
  };
}

export function getEffectiveActiveSession({
  dailyPlan,
  records,
  activeSession,
  now
}: {
  dailyPlan: DailyPlan;
  records: DoseRecord[];
  activeSession: ActiveSession | null;
  now: Date;
}): ActiveSession | null {
  if (!activeSession) {
    return null;
  }

  const focus = selectCurrentScheduleFocus({ dailyPlan, records, now });
  return focus.readyItem?.id === activeSession.scheduleItemId ? activeSession : null;
}
