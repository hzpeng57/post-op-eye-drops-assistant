import type { Medication, TreatmentPlan } from "@/types";

export const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: "levofloxacin",
    name: "左氧氟沙星",
    shortName: "左氧",
    description: "抗感染滴眼液，术后前 5 天使用",
    order: 1,
    accentClass: "bg-sky-500",
    rule: {
      type: "fixed",
      dailyDoseCount: 4,
      activeDays: {
        start: 1,
        end: 5
      }
    }
  },
  {
    id: "fluorometholone",
    name: "氟米龙",
    shortName: "氟米龙",
    description: "抗炎滴眼液，每 3 天减少 1 次",
    order: 2,
    accentClass: "bg-violet-500",
    rule: {
      type: "taper",
      initialDailyDoseCount: 8,
      stepDays: 3,
      decrementEveryStep: 1,
      minimumDailyDoseCount: 0
    }
  },
  {
    id: "calf-blood-gel",
    name: "小牛血去蛋白提取物眼用凝胶",
    shortName: "小牛血",
    description: "促进修复眼用凝胶",
    order: 3,
    accentClass: "bg-amber-500",
    rule: {
      type: "fixed",
      dailyDoseCount: 4
    }
  },
  {
    id: "sodium-hyaluronate",
    name: "玻璃酸钠滴眼液",
    shortName: "玻璃酸钠",
    description: "人工泪液，缓解干涩",
    order: 4,
    accentClass: "bg-emerald-500",
    rule: {
      type: "fixed",
      dailyDoseCount: 4
    }
  }
];

export function createDefaultTreatmentPlan(startDate: string): TreatmentPlan {
  const now = new Date().toISOString();
  return {
    id: "local-treatment-plan",
    schemaVersion: 1,
    startDate,
    wakeTime: "08:00",
    sleepTime: "22:00",
    medicationIntervalMinutes: 5,
    medications: DEFAULT_MEDICATIONS,
    createdAt: now,
    updatedAt: now
  };
}
