import { describe, expect, it } from "vitest";

import { createDefaultTreatmentPlan } from "@/lib/default-plan";
import { migrateTreatmentPlan } from "@/lib/storage";

describe("storage migration", () => {
  it("adds missing default medications to an existing treatment plan", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    // Simulate an old plan that only has 4 medications (no cyclosporine).
    const oldPlan = {
      ...plan,
      medications: plan.medications.filter((m) => m.id !== "cyclosporine")
    };

    expect(oldPlan.medications).toHaveLength(4);

    const migrated = migrateTreatmentPlan(oldPlan);

    expect(migrated.medications).toHaveLength(5);
    expect(migrated.medications.map((m) => m.id)).toEqual([
      "levofloxacin",
      "fluorometholone",
      "calf-blood-gel",
      "sodium-hyaluronate",
      "cyclosporine"
    ]);
  });

  it("leaves an already-complete plan unchanged", () => {
    const plan = createDefaultTreatmentPlan("2026-06-14");
    expect(plan.medications).toHaveLength(5);

    const migrated = migrateTreatmentPlan(plan);

    // Should be the exact same reference since nothing changed.
    expect(migrated).toBe(plan);
  });

  it("preserves existing dose records and active session fields (migration only touches medications)", () => {
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
