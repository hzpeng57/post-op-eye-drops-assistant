import type { DailyPlan, DoseRecord, ProgressSummary } from "@/types";

export function summarizeProgress(
  dailyPlans: DailyPlan[],
  doseRecords: DoseRecord[],
  options: { now: string | Date }
): ProgressSummary {
  const completedStepIds = new Set(
    doseRecords
      .filter((record) => record.status === "completed")
      .map((record) => record.scheduleStepId)
  );
  const nowTime = new Date(options.now).getTime();
  const days = dailyPlans.map((plan) => {
    const steps = plan.items.flatMap((item) => item.steps);
    const completedDoses = steps.filter((step) => completedStepIds.has(step.id)).length;
    const missedDoses = steps.filter(
      (step) => !completedStepIds.has(step.id) && new Date(step.scheduledAt).getTime() < nowTime
    ).length;
    const totalDoses = steps.length;
    return {
      date: plan.date,
      totalDoses,
      completedDoses,
      missedDoses,
      completionRate: totalDoses === 0 ? 0 : Math.round((completedDoses / totalDoses) * 100)
    };
  });

  const totalDoses = days.reduce((sum, day) => sum + day.totalDoses, 0);
  const completedDoses = days.reduce((sum, day) => sum + day.completedDoses, 0);
  const missedDoses = days.reduce((sum, day) => sum + day.missedDoses, 0);

  return {
    startDate: days[0]?.date ?? "",
    endDate: days.at(-1)?.date ?? "",
    totalDoses,
    completedDoses,
    missedDoses,
    completionRate: totalDoses === 0 ? 0 : Math.round((completedDoses / totalDoses) * 100),
    averageCompletedDosesPerDay:
      days.length === 0 ? 0 : Number((completedDoses / days.length).toFixed(1)),
    days
  };
}
