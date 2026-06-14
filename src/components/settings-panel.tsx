"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TreatmentPlan } from "@/types";

export function SettingsPanel({
  treatmentPlan,
  onSave,
  onRegenerate,
  onReset
}: {
  treatmentPlan: TreatmentPlan;
  onSave: (settings: {
    startDate: string;
    wakeTime: string;
    sleepTime: string;
    medicationIntervalMinutes: number;
  }) => void;
  onRegenerate: () => void;
  onReset: () => void;
}) {
  const [startDate, setStartDate] = useState(treatmentPlan.startDate);
  const [wakeTime, setWakeTime] = useState(treatmentPlan.wakeTime);
  const [sleepTime, setSleepTime] = useState(treatmentPlan.sleepTime);
  const [interval, setInterval] = useState(treatmentPlan.medicationIntervalMinutes);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>恢复计划</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              onSave({
                startDate,
                wakeTime,
                sleepTime,
                medicationIntervalMinutes: interval
              });
            }}
          >
            <Field label="开始日期">
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="起床时间">
                <Input
                  type="time"
                  value={wakeTime}
                  onChange={(event) => setWakeTime(event.target.value)}
                />
              </Field>
              <Field label="睡觉时间">
                <Input
                  type="time"
                  value={sleepTime}
                  onChange={(event) => setSleepTime(event.target.value)}
                />
              </Field>
            </div>
            <Field label={`药物间隔：${interval} 分钟`}>
              <input
                type="range"
                min={3}
                max={15}
                value={interval}
                className="w-full accent-sky-600"
                onChange={(event) => setInterval(Number(event.target.value))}
              />
            </Field>
            <Button type="submit" className="w-full">
              <Save className="h-5 w-5" />
              保存设置
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>药物设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {treatmentPlan.medications.map((medication) => (
            <div key={medication.id} className="rounded-3xl bg-slate-50 p-4">
              <p className="font-bold tracking-normal text-slate-950">{medication.name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {medication.rule.type === "fixed"
                  ? `每天 ${medication.rule.dailyDoseCount} 次${
                      medication.rule.activeDays?.end
                        ? `，持续 ${medication.rule.activeDays.end} 天`
                        : ""
                    }`
                  : `初始 ${medication.rule.initialDailyDoseCount} 次，每 ${medication.rule.stepDays} 天减 ${medication.rule.decrementEveryStep} 次`}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle>危险操作</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" className="w-full" onClick={onRegenerate}>
            <RotateCcw className="h-5 w-5" />
            重新生成计划
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              if (window.confirm("确认重置所有数据？此操作无法撤销。")) {
                onReset();
              }
            }}
          >
            <Trash2 className="h-5 w-5" />
            重置所有数据
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
