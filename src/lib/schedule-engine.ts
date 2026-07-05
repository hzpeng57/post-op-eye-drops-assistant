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
  const medicationMap = new Map(plan.medications.map((m) => [m.id, m]));

  /* Compute the maximum cumulative wait between steps in a slot that contains
     every active medication. This replaces the old `(maxStepCount - 1) *
     plan.medicationIntervalMinutes` so that custom per-medication wait times
     don't push the last step past `sleepTime`. */
  const sortedActives = [...activeSummaries].sort((a, b) => a.order - b.order);
  let maxStepWaitSum = 0;
  for (let i = 0; i < sortedActives.length - 1; i++) {
    const nextMed = medicationMap.get(sortedActives[i + 1].medicationId);
    maxStepWaitSum += nextMed?.waitAfterMinutes ?? plan.medicationIntervalMinutes;
  }

  const latestStartMinutes = Math.max(wakeMinutes, sleepMinutes - maxStepWaitSum);
  const spacing =
    slotCount === 1 ? 0 : (latestStartMinutes - wakeMinutes) / (slotCount - 1);

  const selectedSlotsByMedication = new Map(
    activeSummaries.map((summary) => [
      summary.medicationId,
      new Set(distributeDoseSlots(slotCount, summary.dailyDoseCount))
    ])
  );

  /* For medications with a minimum interval between doses, force an extremal
     slot distribution so the first and last dose span the full wake window. */
  for (const summary of activeSummaries) {
    const med = medicationMap.get(summary.medicationId);
    if (med?.minIntervalMinutes && summary.dailyDoseCount >= 2) {
      const doseCount = summary.dailyDoseCount;
      const slots = new Set<number>();
      slots.add(0);
      if (slotCount > 1) {
        slots.add(slotCount - 1);
      }
      const remaining = doseCount - slots.size;
      if (remaining > 0 && slotCount > 2) {
        const inner = distributeDoseSlots(slotCount - 2, remaining);
        for (const s of inner) {
          slots.add(s + 1);
        }
      }
      selectedSlotsByMedication.set(summary.medicationId, slots);
    }
  }

  return Array.from({ length: slotCount }, (_, slotIndex) => {
    const scheduledMinute = Math.round(wakeMinutes + spacing * slotIndex);
    const scheduledAt = localDateTimeToIso(date, scheduledMinute);
    const itemId = `${date}-slot-${slotIndex}`;
    const itemMedications = activeSummaries
      .filter((summary) => selectedSlotsByMedication.get(summary.medicationId)?.has(slotIndex))
      .sort((a, b) => a.order - b.order);

    let cumulativeWait = 0;
    const steps: ScheduleStep[] = itemMedications.map((summary, stepIndex) => {
      const stepScheduledAt = localDateTimeToIso(date, scheduledMinute + cumulativeWait);
      const isLast = stepIndex === itemMedications.length - 1;
      const nextSummary = isLast ? null : itemMedications[stepIndex + 1];
      const nextMed = nextSummary ? medicationMap.get(nextSummary.medicationId) : null;
      const waitAfter = isLast ? null : (nextMed?.waitAfterMinutes ?? plan.medicationIntervalMinutes);

      if (!isLast) {
        cumulativeWait += waitAfter as number;
      }

      return {
        id: `${itemId}-${summary.medicationId}`,
        scheduleItemId: itemId,
        medicationId: summary.medicationId,
        medicationName: summary.name,
        medicationShortName: summary.shortName,
        order: summary.order,
        scheduledAt: stepScheduledAt,
        waitAfterMinutes: waitAfter
      };
    });

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
