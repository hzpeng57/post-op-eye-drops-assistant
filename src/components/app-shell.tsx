"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, History, RefreshCw, Settings, ShieldCheck } from "lucide-react";

import { HistoryPanel } from "@/components/history-panel";
import { MedicationStatus } from "@/components/medication-status";
import { NowCard, getCompletedDoseCount } from "@/components/now-card";
import { Onboarding } from "@/components/onboarding";
import { SettingsPanel } from "@/components/settings-panel";
import { TodayTimeline } from "@/components/today-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTreatmentState } from "@/hooks/use-treatment-state";
import { getEffectiveActiveSession } from "@/lib/current-action";
import { cn } from "@/lib/utils";

type Section = "today" | "history" | "settings";

const navItems = [
  { id: "today" as const, label: "今天", icon: CalendarClock },
  { id: "history" as const, label: "历史", icon: History },
  { id: "settings" as const, label: "设置", icon: Settings }
];

function handleRefreshPage() {
  window.location.reload();
}

export function AppShell() {
  const [section, setSection] = useState<Section>("today");
  const {
    hydrated,
    treatmentPlan,
    todayPlan,
    todayRecords,
    state,
    now,
    today,
    activeSession,
    initializePlan,
    updateSettings,
    regeneratePlan,
    resetAll,
    startSession,
    completeCurrentStep
  } = useTreatmentState();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const completedCount = useMemo(() => {
    if (!todayPlan) {
      return 0;
    }
    return getCompletedDoseCount(todayRecords, todayPlan);
  }, [todayPlan, todayRecords]);
  const completionValue =
    todayPlan && todayPlan.totalDoseCount > 0
      ? Math.round((completedCount / todayPlan.totalDoseCount) * 100)
      : 0;
  const effectiveActiveSession = useMemo(() => {
    if (!todayPlan) {
      return null;
    }
    return getEffectiveActiveSession({
      dailyPlan: todayPlan,
      records: todayRecords,
      activeSession,
      now
    });
  }, [activeSession, now, todayPlan, todayRecords]);

  if (!hydrated) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center text-lg font-semibold text-slate-600">
            正在读取本地计划
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!treatmentPlan || !todayPlan) {
    return <Onboarding onStart={initializePlan} />;
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="min-w-0 space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
                {todayPlan.postOpDay < 1 ? "恢复计划未开始" : `术后第 ${todayPlan.postOpDay} 天`}
              </Badge>
              <h1 className="mt-3 text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
                现在该做什么
              </h1>
            </div>
            <div className="flex w-full items-stretch gap-3 sm:w-auto">
              <div className="min-w-[190px] flex-1 rounded-3xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                  <span>今日完成</span>
                  <span className="tabular-nums text-slate-950">
                    {completedCount} / {todayPlan.totalDoseCount}
                  </span>
                </div>
                <Progress
                  className="mt-3"
                  value={completionValue}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-auto min-h-[74px] w-16 shrink-0 rounded-3xl bg-white/90 shadow-sm ring-1 ring-slate-100"
                aria-label="刷新页面"
                title="刷新页面"
                onClick={handleRefreshPage}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {section === "today" ? (
            <>
              <NowCard
                dailyPlan={todayPlan}
                records={todayRecords}
                activeSession={effectiveActiveSession}
                now={now}
                onStart={startSession}
                onCompleteStep={completeCurrentStep}
              />
              <TodayTimeline
                dailyPlan={todayPlan}
                records={todayRecords}
                activeSession={effectiveActiveSession}
                now={now}
              />
            </>
          ) : null}

          {section === "history" ? (
            <HistoryPanel
              treatmentPlan={treatmentPlan}
              records={state.doseRecords}
              today={today}
              now={now}
            />
          ) : null}

          {section === "settings" ? (
            <SettingsPanel
              key={treatmentPlan.updatedAt}
              treatmentPlan={treatmentPlan}
              onSave={updateSettings}
              onRegenerate={regeneratePlan}
              onReset={resetAll}
            />
          ) : null}
        </section>

        <aside className="min-w-0 space-y-5">
          <MedicationStatus dailyPlan={todayPlan} />
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold tracking-normal text-slate-950">固定顺序</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {treatmentPlan.medicationIntervalMinutes} 分钟间隔
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                {treatmentPlan.medications.map((medication) => (
                  <div
                    key={medication.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
                  >
                    <span className="font-semibold text-slate-700">{medication.name}</span>
                    <span className="text-sm font-bold text-slate-400">{medication.order}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/70 bg-white/90 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2 rounded-3xl bg-slate-100 p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 text-[13px] font-semibold whitespace-nowrap transition sm:gap-2 sm:text-sm [&_svg]:shrink-0",
                  selected ? "bg-slate-950 text-white shadow-sm" : "text-slate-500"
                )}
                onClick={() => setSection(item.id)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
