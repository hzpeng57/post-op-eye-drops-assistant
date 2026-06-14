import type { DailyPlan, NotificationJob, TreatmentPlan } from "@/types";

export interface NotificationService {
  requestPermission(): Promise<NotificationPermission | "unsupported">;
  schedule(job: NotificationJob): Promise<void>;
  cancel(jobId: string): Promise<void>;
  cancelAll(): Promise<void>;
}

export function buildNotificationJobs(
  plan: TreatmentPlan,
  dailyPlan: DailyPlan
): NotificationJob[] {
  return dailyPlan.items.map((item) => ({
    id: `notification-${item.id}`,
    treatmentPlanId: plan.id,
    scheduleItemId: item.id,
    fireAt: item.scheduledAt,
    title: "该滴眼药了",
    body: `开始本次用药：${item.steps.map((step) => step.medicationShortName).join("、")}`,
    status: "pending",
    channel: "browser"
  }));
}

export const browserNotificationService: NotificationService = {
  async requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.requestPermission();
  },
  async schedule() {
    // Real scheduling belongs to Browser Notification, Web Push, or native PWA
    // integrations. The app already produces stable NotificationJob objects.
  },
  async cancel() {},
  async cancelAll() {}
};
