import type { SharedReport } from "@timers/shared/sharedReports"
import type { BossReport } from "@timers/storage/timerSettings"

export type ReportSource = "local" | "shared"

const getReportedAt = (report: BossReport) => {
    return "killedAt" in report ? report.killedAt : report.reportedAt
}

// The newer of this device's report and the shared one wins, so a local
// edit shows until someone shares a fresher time.
export const pickReport = (
    local: BossReport | null,
    shared: SharedReport | null,
): { report: BossReport | null; source: ReportSource | null } => {
    if (shared && (!local || shared.reportedAt >= getReportedAt(local))) {
        return { report: shared.report, source: "shared" }
    }

    return { report: local, source: local ? "local" : null }
}
