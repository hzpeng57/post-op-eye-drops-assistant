"use client";

import { AlertTriangle, ArrowRight, Clock, Play, Sparkles } from "lucide-react";

import { DoseFlow } from "@/components/dose-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { itemIsCompleted, selectCurrentScheduleFocus } from "@/lib/current-action";
import { getItemDisplayTime } from "@/lib/schedule-engine";
import type { ActiveSession, DailyPlan, DoseRecord, ScheduleItem } from "@/types";

function formatDaysUntilStart(postOpDay: number) {
  const days = Math.max(1, 1 - postOpDay);
  return days === 1 ? "明天开始" : `${days}天后开始`;
}

function itemCompletionTime(item: ScheduleItem, records: DoseRecord[]) {
  if (!itemIsCompleted(item, records)) {
    return null;
  }
  const completionTimes = item.steps
    .map((step) =>
      records.find((record) => record.scheduleStepId === step.id && record.status === "completed")
    )
    .filter((record): record is DoseRecord => Boolean(record))
    .map((record) => new Date(record.completedAt).getTime());
  return Math.max(...completionTimes);
}

function formatDistance(targetIso: string, now: Date) {
  const diffMinutes = Math.max(
    0,
    Math.ceil((new Date(targetIso).getTime() - now.getTime()) / 60000)
  );
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes === 0 ? `${hours}小时` : `${hours}小时${minutes}分钟`;
}

export function NowCard({
  dailyPlan,
  records,
  activeSession,
  now,
  onStart,
  onCompleteStep
}: {
  dailyPlan: DailyPlan;
  records: DoseRecord[];
  activeSession: ActiveSession | null;
  now: Date;
  onStart: (itemId: string) => void;
  onCompleteStep: () => void;
}) {
  const activeItem = activeSession
    ? dailyPlan.items.find((item) => item.id === activeSession.scheduleItemId)
    : null;

  if (activeSession && activeItem) {
    return (
      <Card className="border-sky-100 bg-white">
        <CardContent className="p-6 sm:p-8">
          <DoseFlow
            activeSession={activeSession}
            item={activeItem}
            now={now}
            onComplete={onCompleteStep}
          />
        </CardContent>
      </Card>
    );
  }

  if (dailyPlan.postOpDay < 1) {
    return (
      <Card>
        <CardContent className="space-y-7 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-700">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">恢复计划未开始</p>
            <h2 className="mt-2 text-4xl font-bold tracking-normal text-slate-950">
              {formatDaysUntilStart(dailyPlan.postOpDay)}
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              开始日期：{dailyPlan.treatmentStartDate}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { readyItem, nextItem, missedStepCount } = selectCurrentScheduleFocus({
    dailyPlan,
    records,
    now
  });
  const recentlyCompletedItem = dailyPlan.items
    .map((item) => ({ item, completedAt: itemCompletionTime(item, records) }))
    .filter(
      (entry): entry is { item: ScheduleItem; completedAt: number } =>
        entry.completedAt !== null && now.getTime() - entry.completedAt < 10 * 60000
    )
    .sort((a, b) => b.completedAt - a.completedAt)[0]?.item;
  if (readyItem) {
    return (
      <Card className="border-sky-200 bg-white">
        <CardContent className="space-y-7 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <Badge className="bg-sky-50 text-sky-700">到时间了</Badge>
            {missedStepCount > 0 ? (
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                已漏 {missedStepCount} 次
              </span>
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">本次用药</p>
            <h2 className="mt-2 text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              {getItemDisplayTime(readyItem)}
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              {readyItem.steps.map((step) => step.medicationShortName).join(" → ")}
            </p>
          </div>
          <Button size="lg" className="w-full" onClick={() => onStart(readyItem.id)}>
            <Play className="h-6 w-6 fill-current" />
            开始本次用药
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (recentlyCompletedItem && nextItem) {
    return (
      <Card>
        <CardContent className="space-y-7 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">本次用药已完成</p>
            <h2 className="mt-2 text-4xl font-bold tracking-normal text-slate-950">
              下一次：{getItemDisplayTime(nextItem)}
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              {nextItem.steps.map((step) => step.medicationShortName).join(" → ")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nextItem) {
    return (
      <Card>
        <CardContent className="space-y-7 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-50 text-emerald-700">未到时间</Badge>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">下一次用药</p>
            <h2 className="mt-2 text-6xl font-bold tabular-nums tracking-normal text-slate-950">
              {getItemDisplayTime(nextItem)}
            </h2>
            <p className="mt-4 text-xl font-semibold text-slate-700">
              距离开始还有 {formatDistance(nextItem.scheduledAt, now)}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-3xl bg-slate-50 p-4 text-slate-600">
            <ArrowRight className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">
              下一步：{nextItem.steps.map((step) => step.medicationShortName).join(" → ")}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
          <Sparkles className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">今日流程</p>
          <h2 className="mt-2 text-4xl font-bold tracking-normal text-slate-950">
            本次用药已完成
          </h2>
          <p className="mt-3 text-lg text-slate-600">今天没有剩余计划。</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function getCompletedDoseCount(records: DoseRecord[], dailyPlan: DailyPlan) {
  const stepIds = new Set(dailyPlan.items.flatMap((item) => item.steps.map((step) => step.id)));
  return records.filter(
    (record) => record.status === "completed" && stepIds.has(record.scheduleStepId)
  ).length;
}
