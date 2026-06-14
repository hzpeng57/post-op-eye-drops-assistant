import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mobile UI regressions", () => {
  it("keeps onboarding date and primary action visually separated on phones", () => {
    const source = readFileSync("src/components/onboarding.tsx", "utf8");

    expect(source).toContain('className="block space-y-3"');
    expect(source).toContain('className="mt-8 w-full"');
  });

  it("prevents compact navigation buttons from wrapping their labels", () => {
    const appShell = readFileSync("src/components/app-shell.tsx", "utf8");
    const historyPanel = readFileSync("src/components/history-panel.tsx", "utf8");

    expect(appShell).toContain("whitespace-nowrap");
    expect(historyPanel).toContain("whitespace-nowrap");
  });

  it("allows the main app grid column to shrink inside phone viewports", () => {
    const appShell = readFileSync("src/components/app-shell.tsx", "utf8");

    expect(appShell).toContain('className="min-w-0 space-y-5"');
  });

  it("exposes a one-tap page refresh control for stale long-running sessions", () => {
    const appShell = readFileSync("src/components/app-shell.tsx", "utf8");

    expect(appShell).toContain("handleRefreshPage");
    expect(appShell).toContain('aria-label="刷新页面"');
    expect(appShell).toContain("window.location.reload()");
  });

  it("keeps timeline status labels on one line on narrow screens", () => {
    const todayTimeline = readFileSync("src/components/today-timeline.tsx", "utf8");

    expect(todayTimeline).toContain("shrink-0 whitespace-nowrap");
  });
});
