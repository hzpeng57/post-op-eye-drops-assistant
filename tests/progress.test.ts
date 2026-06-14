import { describe, expect, it } from "vitest";

import { createDefaultTreatmentPlan } from "@/lib/default-plan";
import { summarizeProgress } from "@/lib/progress";
import { generateDailyPlan } from "@/lib/schedule-engine";
import type { DoseRecord } from "@/types";

describe("progress summaries", () => {
  it("does not report 100% completion before the treatment starts", () => {
    const plan = createDefaultTreatmentPlan("2026-06-16");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");

    const summary = summarizeProgress([dailyPlan], [], {
      now: "2026-06-14T14:00:00.000+08:00"
    });

    expect(summary.totalDoses).toBe(0);
    expect(summary.completedDoses).toBe(0);
    expect(summary.missedDoses).toBe(0);
    expect(summary.completionRate).toBe(0);
    expect(summary.days[0]?.completionRate).toBe(0);
  });

  it("counts completed and missed doses for a day", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");
    const firstTwoSteps = dailyPlan.items.flatMap((item) => item.steps).slice(0, 2);
    const records: DoseRecord[] = firstTwoSteps.map((step) => ({
      id: `record-${step.id}`,
      treatmentPlanId: plan.id,
      scheduleItemId: step.scheduleItemId,
      scheduleStepId: step.id,
      medicationId: step.medicationId,
      localDate: dailyPlan.date,
      scheduledAt: step.scheduledAt,
      completedAt: "2026-06-14T08:03:00.000+08:00",
      status: "completed"
    }));

    const summary = summarizeProgress([dailyPlan], records, {
      now: "2026-06-14T23:00:00.000+08:00"
    });

    expect(summary.totalDoses).toBe(20);
    expect(summary.completedDoses).toBe(2);
    expect(summary.missedDoses).toBe(18);
    expect(summary.completionRate).toBe(10);
  });
});
