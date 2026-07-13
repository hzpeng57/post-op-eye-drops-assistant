import { describe, expect, it } from "vitest";

import { createDefaultTreatmentPlan } from "@/lib/default-plan";
import {
  calculateDailyMedicationSummaries,
  calculatePostOpDay,
  distributeDoseSlots,
  generateDailyPlan
} from "@/lib/schedule-engine";

describe("schedule engine", () => {
  it("calculates post-op days inclusively from the treatment start date", () => {
    expect(calculatePostOpDay("2026-06-14", "2026-06-14")).toBe(1);
    expect(calculatePostOpDay("2026-06-14", "2026-06-18")).toBe(5);
  });

  it("keeps future start dates in a not-started state", () => {
    const plan = createDefaultTreatmentPlan("2026-06-16");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");

    expect(calculatePostOpDay("2026-06-16", "2026-06-14")).toBe(-1);
    expect(dailyPlan.postOpDay).toBe(-1);
    expect(dailyPlan.items).toHaveLength(0);
    expect(dailyPlan.totalDoseCount).toBe(0);
    expect(dailyPlan.medicationSummaries.every((summary) => summary.courseStatus === "not-started")).toBe(
      true
    );
  });

  it("stops levofloxacin automatically on day 6", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");

    expect(calculateDailyMedicationSummaries(plan, 5)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          medicationId: "levofloxacin",
          dailyDoseCount: 4,
          courseStatus: "active"
        })
      ])
    );
    expect(calculateDailyMedicationSummaries(plan, 6)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          medicationId: "levofloxacin",
          dailyDoseCount: 0,
          courseStatus: "ended"
        })
      ])
    );
  });

  it("tapers fluorometholone every 3 days until it reaches 0", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");

    expect(
      calculateDailyMedicationSummaries(plan, 1).find(
        (summary) => summary.medicationId === "fluorometholone"
      )?.dailyDoseCount
    ).toBe(8);
    expect(
      calculateDailyMedicationSummaries(plan, 4).find(
        (summary) => summary.medicationId === "fluorometholone"
      )?.dailyDoseCount
    ).toBe(7);
    expect(
      calculateDailyMedicationSummaries(plan, 7).find(
        (summary) => summary.medicationId === "fluorometholone"
      )?.dailyDoseCount
    ).toBe(6);
    expect(
      calculateDailyMedicationSummaries(plan, 25).find(
        (summary) => summary.medicationId === "fluorometholone"
      )?.dailyDoseCount
    ).toBe(0);
  });

  it("chooses stable dose slots that reduce reminder count while preserving order", () => {
    expect(distributeDoseSlots(8, 4)).toEqual([0, 2, 4, 6]);
    expect(distributeDoseSlots(7, 4)).toEqual([0, 2, 4, 6]);
    expect(distributeDoseSlots(4, 4)).toEqual([0, 1, 2, 3]);
  });

  it("respects per-medication waitAfterMinutes for cyclosporine", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");

    // Slot 0 has all 4 medications, so the step for sodium-hyaluronate
    // (right before cyclosporine) should have waitAfterMinutes = 15.
    const slot0 = dailyPlan.items[0];
    expect(slot0).toBeDefined();
    const hyaluronateStep = slot0.steps.find(
      (s) => s.medicationId === "sodium-hyaluronate"
    );
    expect(hyaluronateStep).toBeDefined();
    expect(hyaluronateStep!.waitAfterMinutes).toBe(15);

    // The last step (cyclosporine) should have null waitAfterMinutes.
    const cyclosporineStep = slot0.steps.find(
      (s) => s.medicationId === "cyclosporine"
    );
    expect(cyclosporineStep).toBeDefined();
    expect(cyclosporineStep!.waitAfterMinutes).toBeNull();
  });

  it("places cyclosporine doses at extremal slots for 12h minimum interval", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");

    // Cyclosporine should appear in slot 0 and the last slot.
    const slotIdsWithCyclosporine = dailyPlan.items
      .filter((item) =>
        item.steps.some((s) => s.medicationId === "cyclosporine")
      )
      .map((item) => item.slotIndex);

    expect(slotIdsWithCyclosporine).toEqual([0, dailyPlan.items.length - 1]);
  });

  it("generates day-one sessions with merged medication flows in fixed drop order", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");

    expect(dailyPlan.postOpDay).toBe(1);
    expect(dailyPlan.items).toHaveLength(8);
    expect(dailyPlan.totalDoseCount).toBe(18);
    expect(dailyPlan.items[0].steps.map((step) => step.medicationId)).toEqual([
      "levofloxacin",
      "fluorometholone",
      "sodium-hyaluronate",
      "cyclosporine"
    ]);
    expect(dailyPlan.items[1].steps.map((step) => step.medicationId)).toEqual([
      "fluorometholone"
    ]);
  });
});
