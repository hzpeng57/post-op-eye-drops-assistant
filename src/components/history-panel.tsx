"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Activity, CalendarCheck, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { summarizeProgress } from "@/lib/progress";
import { addDays } from "@/lib/time";
import { cn } from "@/lib/utils";
import { generateDailyPlan } from "@/lib/schedule-engine";
import type { DoseRecord, TreatmentPlan } from "@/types";

type Range = "today" | "yesterday" | "week";

const ranges: { id: Range; label: string }[] = [
  { id: "today", label: "今天" },
  { id: "yesterday", label: "昨天" },
  { id: "week", label: "最近7天" }
];

export function HistoryPanel({
  treatmentPlan,
  records,
  today,
  now
}: {
  treatmentPlan: TreatmentPlan;
  records: DoseRecord[];
  today: string;
  now: Date;
}) {
  const [range, setRange] = useState<Range>("today");
  const plans = useMemo(() => {
    if (range === "today") {
      return [generateDailyPlan(treatmentPlan, today)];
    }
    if (range === "yesterday") {
      return [generateDailyPlan(treatmentPlan, addDays(today, -1))];
    }
    return Array.from({ length: 7 }, (_, index) =>
      generateDailyPlan(treatmentPlan, addDays(today, index - 6))
    );
  }, [range, today, treatmentPlan]);
  const summary = summarizeProgress(plans, records, { now });

  return (
    <div className="space-y-4">
      <div className="flex rounded-3xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
        {ranges.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "h-11 min-w-0 flex-1 rounded-2xl px-2 text-sm font-semibold whitespace-nowrap transition",
              range === item.id ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50"
            )}
            onClick={() => setRange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <Metric
            icon={TrendingUp}
            label="完成率"
            value={`${summary.completionRate}%`}
            tone="text-sky-700 bg-sky-50"
          />
          <Metric
            icon={CalendarCheck}
            label="已完成"
            value={`${summary.completedDoses} / ${summary.totalDoses}`}
            tone="text-emerald-700 bg-emerald-50"
          />
          <Metric
            icon={Activity}
            label="漏滴次数"
            value={`${summary.missedDoses}`}
            tone="text-rose-700 bg-rose-50"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>每日记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.days.map((day) => (
            <div key={day.date} className="rounded-3xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold tracking-normal text-slate-950">{day.date}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    完成 {day.completedDoses} / {day.totalDoses}，漏滴 {day.missedDoses}
                  </p>
                </div>
                <span className="text-xl font-bold tabular-nums text-slate-950">
                  {day.completionRate}%
                </span>
              </div>
              <Progress value={day.completionRate} className="mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-normal text-slate-950">
        {value}
      </p>
    </div>
  );
}
