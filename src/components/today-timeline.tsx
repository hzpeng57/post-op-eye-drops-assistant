"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { AlertCircle, CheckCircle2, Circle, Clock3, TimerReset } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { itemIsCompleted, selectCurrentScheduleFocus } from "@/lib/current-action";
import { getItemDisplayTime } from "@/lib/schedule-engine";
import { cn } from "@/lib/utils";
import type { ActiveSession, DailyPlan, DoseRecord, ScheduleItem, ScheduleItemStatus } from "@/types";

function itemStatus(
  item: ScheduleItem,
  records: DoseRecord[],
  activeSession: ActiveSession | null,
  readyItemId: string | null,
  missedItemIds: string[]
): ScheduleItemStatus {
  if (activeSession?.scheduleItemId === item.id) {
    return activeSession.status === "waiting" ? "waiting" : "active";
  }
  if (itemIsCompleted(item, records)) {
    return "completed";
  }
  if (readyItemId === item.id) {
    return "ready";
  }
  if (missedItemIds.includes(item.id)) {
    return "missed";
  }
  return "pending";
}

const statusMeta: Record<
  ScheduleItemStatus,
  { label: string; className: string; icon: ComponentType<{ className?: string }> }
> = {
  completed: { label: "已完成", className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  active: { label: "进行中", className: "bg-sky-50 text-sky-700", icon: Clock3 },
  waiting: { label: "等待中", className: "bg-amber-50 text-amber-700", icon: TimerReset },
  ready: { label: "可开始", className: "bg-sky-50 text-sky-700", icon: Clock3 },
  missed: { label: "已错过", className: "bg-rose-50 text-rose-700", icon: AlertCircle },
  pending: { label: "未开始", className: "bg-slate-100 text-slate-500", icon: Circle }
};

export function TodayTimeline({
  dailyPlan,
  records,
  activeSession,
  now
}: {
  dailyPlan: DailyPlan;
  records: DoseRecord[];
  activeSession: ActiveSession | null;
  now: Date;
}) {
  const [openItemId, setOpenItemId] = useState<string | null>(dailyPlan.items[0]?.id ?? null);
  const focus = selectCurrentScheduleFocus({ dailyPlan, records, now });

  return (
    <Card>
      <CardHeader>
        <CardTitle>今日时间轴</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dailyPlan.items.map((item) => {
          const status = itemStatus(
            item,
            records,
            activeSession,
            focus.readyItem?.id ?? null,
            focus.missedItemIds
          );
          const meta = statusMeta[status];
          const Icon = meta.icon;
          const isOpen = openItemId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className="w-full rounded-3xl border border-slate-100 bg-white p-4 text-left transition hover:border-sky-100 hover:bg-sky-50/30"
              onClick={() => setOpenItemId(isOpen ? null : item.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      meta.className
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xl font-bold tabular-nums tracking-normal text-slate-950">
                      {getItemDisplayTime(item)}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {item.steps.map((step) => step.medicationShortName).join(" → ")}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
                    meta.className
                  )}
                >
                  {meta.label}
                </span>
              </div>

              {isOpen ? (
                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
                  {item.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-slate-700">
                        {index + 1}. {step.medicationName}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {new Date(step.scheduledAt).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
