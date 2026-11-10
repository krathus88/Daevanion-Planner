import type { SharedReport } from "@timers/shared/sharedReports"
import type { BossReport } from "@timers/storage/timerSettings"

export type ReportSource = "local" | "shared" | "notmeter"

const getReportedAt = (report: BossReport) => {
    return "killedAt" in report ? report.killedAt : report.reportedAt
}

// The newest of this device's report, NotMeter's live time and the shared
// one wins, so a manual report shows until a later kill comes in. NotMeter's
// is dated by the kill it counts from, so it takes over only once its meter
// records a new kill, and pressing Killed takes it back. Ties go to shared,
// then NotMeter.
export const pickReport = (
    local: BossReport | null,
    shared: SharedReport | null,
    notmeter: SharedReport | null = null,
): { report: BossReport | null; source: ReportSource | null } => {
    let report = local
    let source: ReportSource | null = local ? "local" : null
    let reportedAt = local ? getReportedAt(local) : -Infinity

    if (notmeter && notmeter.reportedAt >= reportedAt) {
        report = notmeter.report
        source = "notmeter"
        reportedAt = notmeter.reportedAt
    }

    if (shared && shared.reportedAt >= reportedAt) {
        report = shared.report
        source = "shared"
    }

    return { report: report, source: source }
}
