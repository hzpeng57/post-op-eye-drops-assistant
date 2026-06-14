import type {
  DailyPlan,
  Medication,
  MedicationDailySummary,
  ScheduleItem,
  ScheduleStep,
  TreatmentPlan
} from "@/types";
import { formatClockTime, localDateTimeToIso, parseClockTime, parseLocalDate } from "@/lib/time";

export function calculatePostOpDay(startDate: string, targetDate: string): number {
  const start = parseLocalDate(startDate).getTime();
  const target = parseLocalDate(targetDate).getTime();
  return Math.floor((target - start) / 86400000) + 1;
}

export function calculateDailyMedicationSummaries(
  plan: TreatmentPlan,
  postOpDay: number
): MedicationDailySummary[] {
  return plan.medications
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((medication) => {
      const dailyDoseCount = calculateDoseCount(medication, postOpDay);
      const courseStatus = getCourseStatus(medication, postOpDay, dailyDoseCount);
      return {
        medicationId: medication.id,
        name: medication.name,
        shortName: medication.shortName,
        dailyDoseCount,
        courseStatus,
        order: medication.order,
        accentClass: medication.accentClass,
        note: buildMedicationNote(medication, dailyDoseCount, courseStatus)
      };
    });
}

export function distributeDoseSlots(totalSlots: number, doseCount: number): number[] {
  if (totalSlots <= 0 || doseCount <= 0) {
    return [];
  }
  if (doseCount >= totalSlots) {
    return Array.from({ length: totalSlots }, (_, index) => index);
  }
  if (doseCount === 1) {
    return [0];
  }

  const indexes =
    totalSlots % doseCount === 0
      ? Array.from({ length: doseCount }, (_, index) =>
          Math.floor((index * totalSlots) / doseCount)
        )
      : Array.from({ length: doseCount }, (_, index) =>
          Math.round((index * (totalSlots - 1)) / (doseCount - 1))
        );

  return normalizeIndexes(indexes, totalSlots, doseCount);
}

export function generateDailyPlan(plan: TreatmentPlan, date: string): DailyPlan {
  const postOpDay = calculatePostOpDay(plan.startDate, date);
  const medicationSummaries = calculateDailyMedicationSummaries(plan, postOpDay);
  const activeSummaries = medicationSummaries.filter((summary) => summary.dailyDoseCount > 0);
  const totalDoseCount = activeSummaries.reduce(
    (total, summary) => total + summary.dailyDoseCount,
    0
  );
  const maxDoseCount = Math.max(0, ...activeSummaries.map((summary) => summary.dailyDoseCount));
  const items =
    maxDoseCount === 0
      ? []
      : buildScheduleItems(plan, date, activeSummaries, maxDoseCount);

  return {
    date,
    treatmentPlanId: plan.id,
    treatmentStartDate: plan.startDate,
    postOpDay,
    wakeTime: plan.wakeTime,
    sleepTime: plan.sleepTime,
    medicationIntervalMinutes: plan.medicationIntervalMinutes,
    medicationSummaries,
    items,
    totalDoseCount
  };
}

function calculateDoseCount(medication: Medication, postOpDay: number): number {
  if (postOpDay < 1) {
    return 0;
  }

  if (medication.rule.type === "fixed") {
    const activeDays = medication.rule.activeDays;
    if (activeDays && postOpDay < activeDays.start) {
      return 0;
    }
    if (activeDays?.end && postOpDay > activeDays.end) {
      return 0;
    }
    return medication.rule.dailyDoseCount;
  }

  const taperStep = Math.floor((postOpDay - 1) / medication.rule.stepDays);
  return Math.max(
    medication.rule.minimumDailyDoseCount,
    medication.rule.initialDailyDoseCount - taperStep * medication.rule.decrementEveryStep
  );
}

function getCourseStatus(
  medication: Medication,
  postOpDay: number,
  dailyDoseCount: number
): MedicationDailySummary["courseStatus"] {
  if (dailyDoseCount > 0) {
    return "active";
  }
  if (postOpDay < 1) {
    return "not-started";
  }
  if (medication.rule.type === "fixed" && medication.rule.activeDays?.start) {
    return postOpDay < medication.rule.activeDays.start ? "not-started" : "ended";
  }
  return "ended";
}

function buildMedicationNote(
  medication: Medication,
  dailyDoseCount: number,
  courseStatus: MedicationDailySummary["courseStatus"]
): string {
  if (courseStatus === "ended") {
    return "已结束疗程";
  }
  if (courseStatus === "not-started") {
    return "尚未开始";
  }
  if (medication.rule.type === "taper") {
    return `${dailyDoseCount}次 / 天，自动减量中`;
  }
  return `${dailyDoseCount}次 / 天`;
}

function buildScheduleItems(
  plan: TreatmentPlan,
  date: string,
  activeSummaries: MedicationDailySummary[],
  slotCount: number
): ScheduleItem[] {
  const wakeMinutes = parseClockTime(plan.wakeTime);
  const sleepMinutes = parseClockTime(plan.sleepTime);
  const maxStepCount = activeSummaries.length;
  const latestStartMinutes = Math.max(
    wakeMinutes,
    sleepMinutes - (maxStepCount - 1) * plan.medicationIntervalMinutes
  );
  const spacing =
    slotCount === 1 ? 0 : (latestStartMinutes - wakeMinutes) / (slotCount - 1);
  const selectedSlotsByMedication = new Map(
    activeSummaries.map((summary) => [
      summary.medicationId,
      new Set(distributeDoseSlots(slotCount, summary.dailyDoseCount))
    ])
  );

  return Array.from({ length: slotCount }, (_, slotIndex) => {
    const scheduledMinute = Math.round(wakeMinutes + spacing * slotIndex);
    const scheduledAt = localDateTimeToIso(date, scheduledMinute);
    const itemId = `${date}-slot-${slotIndex}`;
    const itemMedications = activeSummaries
      .filter((summary) => selectedSlotsByMedication.get(summary.medicationId)?.has(slotIndex))
      .sort((a, b) => a.order - b.order);
    const steps: ScheduleStep[] = itemMedications.map((summary, stepIndex) => ({
      id: `${itemId}-${summary.medicationId}`,
      scheduleItemId: itemId,
      medicationId: summary.medicationId,
      medicationName: summary.name,
      medicationShortName: summary.shortName,
      order: summary.order,
      scheduledAt: localDateTimeToIso(
        date,
        scheduledMinute + stepIndex * plan.medicationIntervalMinutes
      ),
      waitAfterMinutes:
        stepIndex === itemMedications.length - 1 ? null : plan.medicationIntervalMinutes
    }));

    return {
      id: itemId,
      treatmentPlanId: plan.id,
      localDate: date,
      scheduledAt,
      slotIndex,
      steps
    };
  }).filter((item) => item.steps.length > 0);
}

function normalizeIndexes(indexes: number[], totalSlots: number, doseCount: number): number[] {
  const selected = new Set<number>();
  for (const index of indexes) {
    selected.add(Math.min(Math.max(index, 0), totalSlots - 1));
  }

  let candidate = 0;
  while (selected.size < doseCount && candidate < totalSlots) {
    selected.add(candidate);
    candidate += 1;
  }

  return [...selected].sort((a, b) => a - b).slice(0, doseCount);
}

export function getItemDisplayTime(item: ScheduleItem): string {
  const date = new Date(item.scheduledAt);
  return formatClockTime(date.getHours() * 60 + date.getMinutes());
}
