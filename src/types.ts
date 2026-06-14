export type MedicationId =
  | "levofloxacin"
  | "fluorometholone"
  | "calf-blood-gel"
  | "sodium-hyaluronate";

export type MedicationRule =
  | {
      type: "fixed";
      dailyDoseCount: number;
      activeDays?: {
        start: number;
        end?: number;
      };
    }
  | {
      type: "taper";
      initialDailyDoseCount: number;
      stepDays: number;
      decrementEveryStep: number;
      minimumDailyDoseCount: number;
    };

export interface Medication {
  id: MedicationId;
  name: string;
  shortName: string;
  description: string;
  order: number;
  accentClass: string;
  rule: MedicationRule;
}

export interface TreatmentPlan {
  id: string;
  schemaVersion: 1;
  startDate: string;
  wakeTime: string;
  sleepTime: string;
  medicationIntervalMinutes: number;
  medications: Medication[];
  createdAt: string;
  updatedAt: string;
}

export type CourseStatus = "active" | "ended" | "not-started";

export interface MedicationDailySummary {
  medicationId: MedicationId;
  name: string;
  shortName: string;
  dailyDoseCount: number;
  courseStatus: CourseStatus;
  order: number;
  accentClass: string;
  note: string;
}

export type ScheduleItemStatus =
  | "completed"
  | "active"
  | "waiting"
  | "ready"
  | "missed"
  | "pending";

export interface ScheduleStep {
  id: string;
  scheduleItemId: string;
  medicationId: MedicationId;
  medicationName: string;
  medicationShortName: string;
  order: number;
  scheduledAt: string;
  waitAfterMinutes: number | null;
}

export interface ScheduleItem {
  id: string;
  treatmentPlanId: string;
  localDate: string;
  scheduledAt: string;
  slotIndex: number;
  steps: ScheduleStep[];
}

export interface DailyPlan {
  date: string;
  treatmentPlanId: string;
  treatmentStartDate: string;
  postOpDay: number;
  wakeTime: string;
  sleepTime: string;
  medicationIntervalMinutes: number;
  medicationSummaries: MedicationDailySummary[];
  items: ScheduleItem[];
  totalDoseCount: number;
}

export type DoseRecordStatus = "completed" | "skipped";

export interface DoseRecord {
  id: string;
  treatmentPlanId: string;
  scheduleItemId: string;
  scheduleStepId: string;
  medicationId: MedicationId;
  localDate: string;
  scheduledAt: string;
  completedAt: string;
  status: DoseRecordStatus;
}

export interface NotificationJob {
  id: string;
  treatmentPlanId: string;
  scheduleItemId: string;
  fireAt: string;
  title: string;
  body: string;
  status: "pending" | "scheduled" | "sent" | "cancelled";
  channel: "browser" | "web-push" | "ios-pwa" | "android-push";
}

export interface DailyProgress {
  date: string;
  totalDoses: number;
  completedDoses: number;
  missedDoses: number;
  completionRate: number;
}

export interface ProgressSummary {
  startDate: string;
  endDate: string;
  totalDoses: number;
  completedDoses: number;
  missedDoses: number;
  completionRate: number;
  averageCompletedDosesPerDay: number;
  days: DailyProgress[];
}

export interface ActiveSession {
  scheduleItemId: string;
  currentStepIndex: number;
  status: "active" | "waiting" | "completed";
  waitUntil?: string;
  startedAt: string;
}

export interface PersistedAppState {
  schemaVersion: 1;
  treatmentPlan: TreatmentPlan | null;
  doseRecords: DoseRecord[];
  activeSession: ActiveSession | null;
  generatedAt: string;
}
