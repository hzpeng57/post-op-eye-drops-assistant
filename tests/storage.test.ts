import { describe, expect, it } from "vitest";

import { createDefaultTreatmentPlan } from "@/lib/default-plan";
import { migrateTreatmentPlan } from "@/lib/storage";
import type { Medication } from "@/types";

describe("storage migration", () => {
  it("adds missing default medications to an existing treatment plan", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    // Simulate a plan that is missing cyclosporine.
    const oldPlan = {
      ...plan,
      medications: plan.medications.filter((m) => m.id !== "cyclosporine")
    };

    expect(oldPlan.medications).toHaveLength(3);

    const migrated = migrateTreatmentPlan(oldPlan);

    expect(migrated.medications).toHaveLength(4);
    expect(migrated.medications.map((m) => m.id)).toEqual([
      "levofloxacin",
      "fluorometholone",
      "sodium-hyaluronate",
      "cyclosporine"
    ]);
  });

  it("removes deprecated medications that are no longer in defaults", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    // Simulate a plan that still has calf-blood-gel from an older version.
    const calfBloodGel: Medication = {
      id: "calf-blood-gel",
      name: "小牛血去蛋白提取物眼用凝胶",
      shortName: "小牛血",
      description: "促进修复眼用凝胶",
      order: 3,
      accentClass: "bg-amber-500",
      rule: { type: "fixed", dailyDoseCount: 4 }
    };
    const oldPlan = {
      ...plan,
      medications: [...plan.medications, calfBloodGel].sort((a, b) => a.order - b.order)
    };

    expect(oldPlan.medications).toHaveLength(5);
    expect(oldPlan.medications.some((m) => m.id === "calf-blood-gel")).toBe(true);

    const migrated = migrateTreatmentPlan(oldPlan);

    expect(migrated.medications).toHaveLength(4);
    expect(migrated.medications.some((m) => m.id === "calf-blood-gel")).toBe(false);
  });

  it("leaves an already-complete plan unchanged", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    expect(plan.medications).toHaveLength(4);

    const migrated = migrateTreatmentPlan(plan);

    // Should be the exact same reference since nothing changed.
    expect(migrated).toBe(plan);
  });

  it("preserves plan fields unrelated to medications", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    const oldPlan = {
      ...plan,
      medications: plan.medications.filter((m) => m.id !== "cyclosporine"),
      startDate: "2026-01-01",
      wakeTime: "09:00"
    };

    const migrated = migrateTreatmentPlan(oldPlan);

    expect(migrated.startDate).toBe("2026-01-01");
    expect(migrated.wakeTime).toBe("09:00");
    expect(migrated.id).toBe(oldPlan.id);
  });
});
