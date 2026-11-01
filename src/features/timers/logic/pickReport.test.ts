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
