import { describe, expect, it } from "vitest";

import { getEffectiveActiveSession, selectCurrentScheduleFocus } from "@/lib/current-action";
import { createDefaultTreatmentPlan } from "@/lib/default-plan";
import { generateDailyPlan } from "@/lib/schedule-engine";
import type { DoseRecord } from "@/types";

describe("current action selection", () => {
  it("uses the latest due session instead of forcing the first morning session", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");

    const focus = selectCurrentScheduleFocus({
      dailyPlan,
      records: [],
      now: new Date("2026-06-14T15:30:00.000+08:00")
    });

    expect(focus.readyItem?.id).toBe(dailyPlan.items[3].id);
    expect(focus.readyItem?.id).not.toBe(dailyPlan.items[0].id);
    expect(focus.nextItem?.id).toBe(dailyPlan.items[4].id);
    expect(focus.missedStepCount).toBe(
      dailyPlan.items
        .slice(0, 3)
        .reduce((total, item) => total + item.steps.length, 0)
    );
  });

  it("does not resurrect older missed sessions after the latest due session is completed", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");
    const latestDueItem = dailyPlan.items[3];
    const records: DoseRecord[] = latestDueItem.steps.map((step) => ({
      id: `record-${step.id}`,
      treatmentPlanId: plan.id,
      scheduleItemId: latestDueItem.id,
      scheduleStepId: step.id,
      medicationId: step.medicationId,
      localDate: dailyPlan.date,
      scheduledAt: step.scheduledAt,
      completedAt: "2026-06-14T15:25:00.000+08:00",
      status: "completed"
    }));

    const focus = selectCurrentScheduleFocus({
      dailyPlan,
      records,
      now: new Date("2026-06-14T15:30:00.000+08:00")
    });

    expect(focus.readyItem).toBeNull();
    expect(focus.nextItem?.id).toBe(dailyPlan.items[4].id);
    expect(focus.missedItemIds).toEqual([
      dailyPlan.items[0].id,
      dailyPlan.items[1].id,
      dailyPlan.items[2].id
    ]);
  });

  it("ignores a persisted active session after later sessions have become due", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");
    const activeSession = {
      scheduleItemId: dailyPlan.items[0].id,
      currentStepIndex: 1,
      status: "active" as const,
      startedAt: "2026-06-14T08:00:00.000+08:00"
    };

    expect(
      getEffectiveActiveSession({
        dailyPlan,
        records: [],
        activeSession,
        now: new Date("2026-06-14T15:30:00.000+08:00")
      })
    ).toBeNull();

    expect(
      getEffectiveActiveSession({
        dailyPlan,
        records: [],
        activeSession: {
          ...activeSession,
          scheduleItemId: dailyPlan.items[3].id,
          startedAt: "2026-06-14T14:00:00.000+08:00"
        },
        now: new Date("2026-06-14T15:30:00.000+08:00")
      })?.scheduleItemId
    ).toBe(dailyPlan.items[3].id);
  });
});
