import { describe, expect, it } from "vitest"
import { pickReport } from "./pickReport"

const local = { spawnAt: 500, reportedAt: 100 }
const shared = (reportedAt: number) => {
    return { report: { killedAt: 900 }, reportedAt: reportedAt }
}

describe("pickReport", () => {
    it("is empty with neither report", () => {
        expect(pickReport(null, null)).toEqual({ report: null, source: null })
    })

    it("uses the only report there is", () => {
        expect(pickReport(local, null)).toEqual({
            report: local,
            source: "local",
        })
        expect(pickReport(null, shared(1)).source).toBe("shared")
    })

    it("takes the newer side", () => {
        expect(pickReport(local, shared(99)).source).toBe("local")
        expect(pickReport(local, shared(101)).source).toBe("shared")
    })

    it("prefers shared on a tie", () => {
        expect(pickReport(local, shared(100)).source).toBe("shared")
    })

    it("dates a kill report by its kill time", () => {
        expect(pickReport({ killedAt: 200 }, shared(150)).source).toBe("local")
    })
})

describe("pickReport with NotMeter", () => {
    const notmeter = (reportedAt: number) => {
        return {
            report: { spawnAt: 700, reportedAt: reportedAt },
            reportedAt: reportedAt,
        }
    }

    it("uses NotMeter's time when it's the only one", () => {
        expect(pickReport(null, null, notmeter(1))).toEqual({
            report: { spawnAt: 700, reportedAt: 1 },
            source: "notmeter",
        })
    })

    it("takes the newest of all three", () => {
        expect(pickReport(local, shared(50), notmeter(101)).source).toBe(
            "notmeter",
        )
        expect(pickReport(local, shared(50), notmeter(99)).source).toBe("local")
        expect(pickReport(local, shared(102), notmeter(101)).source).toBe(
            "shared",
        )
    })

    it("prefers shared, then NotMeter, on a tie", () => {
        expect(pickReport(local, null, notmeter(100)).source).toBe("notmeter")
        expect(pickReport(null, shared(5), notmeter(5)).source).toBe("shared")
    })
})

describe("a manual report against NotMeter's kills", () => {
    const HOUR = 3_600_000
    // NotMeter's time for a kill at `killedAt` (2 h respawn).
    const notmeterKill = (killedAt: number) => {
        return {
            report: { spawnAt: killedAt + 2 * HOUR, reportedAt: killedAt + 1 },
            reportedAt: killedAt,
        }
    }
    const manual = { spawnAt: 13 * HOUR, reportedAt: 12 * HOUR }

    it("keeps the manual report over an older kill", () => {
        expect(pickReport(manual, null, notmeterKill(11 * HOUR)).source).toBe(
            "local",
        )
    })

    it("switches to NotMeter once it records a later kill", () => {
        expect(pickReport(manual, null, notmeterKill(13 * HOUR)).source).toBe(
            "notmeter",
        )
    })

    it("goes back to the manual timer when Killed is pressed later", () => {
        expect(
            pickReport({ killedAt: 13.5 * HOUR }, null, notmeterKill(13 * HOUR))
                .source,
        ).toBe("local")
    })
})
