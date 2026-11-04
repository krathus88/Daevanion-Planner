import { describe, expect, it } from "vitest"
import {
    formatOptionsChecked,
    improvementStatus,
    joinParagraphs,
    NO_FINDS,
    planPhaseStatus,
    searchSummary,
} from "./improvementStatus"

const improved = {
    optionsChecked: 4820,
    firstFoundMs: 3400,
    improvements: 5,
    lastImprovedMs: 72_000,
}

describe("improvementStatus", () => {
    it("says the first result is still being built", () => {
        expect(improvementStatus({ finds: NO_FINDS, noun: "plan" })).toBe(
            "Building the first plan…",
        )
    })

    it("says when the first result was ready, to a tenth under 10s", () => {
        expect(
            improvementStatus({
                finds: { ...NO_FINDS, firstFoundMs: 3400 },
                noun: "route",
            }),
        ).toBe("First route ready at 3.4s · looking for a better one")
    })

    it("says when the last improvement was found and how many", () => {
        expect(improvementStatus({ finds: improved, noun: "plan" })).toBe(
            "Best plan so far found at 1m 12s · 5 improvements",
        )
    })

    it("counts a single improvement in the singular", () => {
        expect(
            improvementStatus({
                finds: { ...improved, improvements: 1, lastImprovedMs: 900 },
                noun: "route",
            }),
        ).toBe("Best route so far found at 0.9s · 1 improvement")
    })

    it("doesn't claim a time of 0.0s", () => {
        expect(
            improvementStatus({
                finds: { ...improved, improvements: 2, lastImprovedMs: 30 },
                noun: "route",
            }),
        ).toBe("Best route so far found at <0.1s · 2 improvements")
    })

    it("words a search from the current result until it beats it", () => {
        expect(
            improvementStatus({
                finds: NO_FINDS,
                noun: "route",
                fromCurrent: true,
            }),
        ).toBe("Looking for a better route than the current one")
        expect(
            improvementStatus({
                finds: { ...NO_FINDS, improvements: 1, lastImprovedMs: 2000 },
                noun: "route",
                fromCurrent: true,
            }),
        ).toBe("Best route so far found at 2.0s · 1 improvement")
    })
})

describe("planPhaseStatus", () => {
    it("names the step the all-boards search is on", () => {
        expect(planPhaseStatus({ ...NO_FINDS, optionsChecked: 1240 })).toBe(
            "Step 1 of 2: building the plan · 1,240 options checked",
        )
        expect(planPhaseStatus(improved)).toBe(
            "Step 2 of 2: refining it · 4,820 options checked",
        )
    })
})

describe("formatOptionsChecked", () => {
    it("counts options in the singular and plural", () => {
        expect(formatOptionsChecked(1)).toBe("1 option checked")
        expect(formatOptionsChecked(12_000)).toBe("12,000 options checked")
    })
})

describe("searchSummary", () => {
    it("says what was checked and found", () => {
        expect(searchSummary({ finds: improved, noun: "plan" })).toBe(
            "Checked 4,820 options. Found 5 better plans after the first, the last at 1m 12s.",
        )
    })

    it("compares with the current result when it started from one", () => {
        expect(
            searchSummary({
                finds: { ...improved, improvements: 1 },
                noun: "route",
                fromCurrent: true,
            }),
        ).toBe(
            "Checked 4,820 options. Found 1 better route than the current one, the last at 1m 12s.",
        )
    })

    it("says when nothing beat the first result", () => {
        expect(
            searchSummary({
                finds: { ...NO_FINDS, optionsChecked: 1, firstFoundMs: 4200 },
                noun: "plan",
            }),
        ).toBe(
            "Checked 1 option. No better plan turned up after the first at 4.2s.",
        )
    })

    it("only counts the options when nothing beat the current result", () => {
        expect(
            searchSummary({
                finds: { ...NO_FINDS, optionsChecked: 900 },
                noun: "route",
                fromCurrent: true,
            }),
        ).toBe("Checked 900 options.")
    })

    it("says nothing when nothing was checked or found", () => {
        expect(searchSummary({ finds: NO_FINDS, noun: "plan" })).toBe("")
    })
})

describe("joinParagraphs", () => {
    it("puts each part in its own paragraph and skips empty ones", () => {
        expect(joinParagraphs("First.", "", "Second.")).toBe(
            "First.\n\nSecond.",
        )
        expect(joinParagraphs("Only.", "")).toBe("Only.")
    })
})
