"use client";

import { useState } from "react";
import { CalendarDays, Droplets } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toLocalDateString } from "@/lib/time";

export function Onboarding({ onStart }: { onStart: (startDate: string) => void }) {
  const [startDate, setStartDate] = useState(() => toLocalDateString(new Date()));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-5 py-8">
      <Card className="w-full overflow-hidden">
        <CardContent className="space-y-8 p-7 sm:p-9">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-600 text-white">
              <Droplets className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sky-700">Post-Op Eye Drops</p>
              <h1 className="text-3xl font-bold tracking-normal text-slate-950">术后滴眼液助手</h1>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-lg leading-8 text-slate-700">
              设置恢复计划开始日期后，系统会自动计算每天用药次数、顺序和等待时间。
            </p>
          </div>

          <label className="block min-w-0 space-y-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarDays className="h-4 w-4" />
              恢复计划开始日期
            </span>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <Button size="lg" className="mt-8 w-full" onClick={() => onStart(startDate)}>
            开始使用
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
