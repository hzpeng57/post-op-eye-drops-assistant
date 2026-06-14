import { describe, expect, it } from "vitest";

import { createDefaultTreatmentPlan } from "@/lib/default-plan";
import { buildNotificationJobs } from "@/lib/notifications";
import { generateDailyPlan } from "@/lib/schedule-engine";

describe("notification jobs", () => {
  it("creates one pending notification job per schedule item", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");

    const jobs = buildNotificationJobs(plan, dailyPlan);

    expect(jobs).toHaveLength(dailyPlan.items.length);
    expect(jobs[0]).toEqual(
      expect.objectContaining({
        treatmentPlanId: plan.id,
        scheduleItemId: dailyPlan.items[0].id,
        fireAt: dailyPlan.items[0].scheduledAt,
        status: "pending",
        channel: "browser"
      })
    );
  });
});
