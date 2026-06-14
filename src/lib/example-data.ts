import { createDefaultTreatmentPlan } from "@/lib/default-plan";
import { generateDailyPlan } from "@/lib/schedule-engine";
import type { DoseRecord } from "@/types";

export const exampleTreatmentPlan = createDefaultTreatmentPlan("2026-06-14");

export const exampleDailyPlan = generateDailyPlan(exampleTreatmentPlan, "2026-06-14");

export const exampleDoseRecords: DoseRecord[] = exampleDailyPlan.items
  .flatMap((item) => item.steps)
  .slice(0, 3)
  .map((step, index) => ({
    id: `example-dose-${index + 1}`,
    treatmentPlanId: exampleTreatmentPlan.id,
    scheduleItemId: step.scheduleItemId,
    scheduleStepId: step.id,
    medicationId: step.medicationId,
    localDate: "2026-06-14",
    scheduledAt: step.scheduledAt,
    completedAt: new Date(2026, 5, 14, 8, 2 + index * 5).toISOString(),
    status: "completed"
  }));
