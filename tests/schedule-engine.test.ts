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

  it("generates day-one sessions with merged medication flows in fixed drop order", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const dailyPlan = generateDailyPlan(plan, "2026-06-14");

    expect(dailyPlan.postOpDay).toBe(1);
    expect(dailyPlan.items).toHaveLength(8);
    expect(dailyPlan.totalDoseCount).toBe(20);
    expect(dailyPlan.items[0].steps.map((step) => step.medicationId)).toEqual([
      "levofloxacin",
      "fluorometholone",
      "calf-blood-gel",
      "sodium-hyaluronate"
    ]);
    expect(dailyPlan.items[1].steps.map((step) => step.medicationId)).toEqual([
      "fluorometholone"
    ]);
  });
});
