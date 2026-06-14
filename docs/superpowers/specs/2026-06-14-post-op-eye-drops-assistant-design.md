# Post-Op Eye Drops Assistant Design

## Goal

Build a production-ready local-first Next.js web app that tells a post-op myopia surgery patient exactly what to do now, what comes next, what remains today, and what was missed. Users should never calculate recovery day, dose count, tapering, medication order, or waiting time.

## Product Shape

The app opens to a single-purpose dashboard: "现在该做什么？". It shows the post-op day, today's completed dose count, and a dominant action card. The card has five states: next session countdown, ready to start, active medication step, wait countdown, and completed session with the next session time. The UI uses large type, high contrast, generous spacing, touch-sized controls, and a quiet Apple Health plus Linear visual style.

Secondary surfaces are available from bottom navigation: Today, History, and Settings. Today contains the full timeline and medication status. History supports today, yesterday, and recent 7 days with completion rate and missed-dose counts. Settings contains recovery start date, wake/sleep times, medicine interval, medication rules, regenerate plan, and reset all data.

## Architecture

The application is a Next.js App Router project with a client-side product shell because all current authoritative state lives on the device. Pure TypeScript modules handle treatment defaults, dose frequency, day calculation, schedule generation, progress summaries, storage migration, and notification job generation. React components consume a small app state hook that reads and writes LocalStorage.

Future Supabase support can replace the storage adapter without changing the schedule engine. Future Push Notification support can implement the reserved `NotificationService` interface and consume generated `NotificationJob` values.

## Scheduling Rules

The default plan starts on the date selected at first launch. Levofloxacin is 4 times daily through post-op day 5 and ends automatically on day 6. Fluorometholone starts at 8 times daily for days 1-3, decreases by 1 every 3 days, and bottoms out at 0. Calf blood deproteinized extract eye gel and sodium hyaluronate are 4 times daily. The fixed drop order is levofloxacin, fluorometholone, calf blood gel, sodium hyaluronate.

The schedule engine creates a daily slot grid from the maximum active medication frequency for the day. Lower-frequency medications are assigned to stable slots across that grid so reminders are merged aggressively while remaining spread across waking hours. Each generated `ScheduleItem` contains ordered `ScheduleStep` values. The configured medication interval, default 5 minutes and adjustable from 3 to 15, is applied between steps in a flow.

## Data Model

Core types are `Medication`, `TreatmentPlan`, `ScheduleItem`, `ScheduleStep`, `DoseRecord`, `DailyPlan`, `NotificationJob`, and `ProgressSummary`. Dates are stored as local date strings for daily identity and ISO strings with offsets for exact scheduled/completed times. The app keeps derived plans reproducible instead of persisting every future generated day.

## Error Handling

Storage reads are validated by schema version and fall back to defaults if corrupted. Reset is explicit and destructive. Settings inputs clamp medication interval to 3-15 minutes and require wake time to be before sleep time. If a session is missed, the dashboard marks remaining overdue steps as missed but still lets the user view details.

## Testing

Unit tests cover inclusive post-op day calculation, levofloxacin course ending, fluorometholone tapering, dose slot distribution, day-one merged flows, and progress summaries. Build/typecheck validates the Next.js app. Browser verification checks desktop and mobile layouts after implementation.
