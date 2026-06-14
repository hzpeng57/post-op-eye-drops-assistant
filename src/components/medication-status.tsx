import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyPlan } from "@/types";

export function MedicationStatus({ dailyPlan }: { dailyPlan: DailyPlan }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>今日方案</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {dailyPlan.medicationSummaries.map((summary) => (
          <div key={summary.medicationId} className="rounded-3xl bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-3 w-3 rounded-full ${summary.accentClass}`} />
              <div className="min-w-0">
                <p className="font-bold tracking-normal text-slate-950">{summary.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{summary.note}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
