import { describe, expect, it } from "vitest"
import type { TaskGroup } from "./trackerCards"
import {
    getCorridorName,
    getCorridorsUsed,
    getCorridorView,
    withCorridorView,
} from "./corridors"

const hold = { period: 7, at: 1000, artifacts: ["1001", "1002"] }
const readAfter = { period: 7, at: 2000, artifacts: ["1002"] }

describe("getCorridorView", () => {
    it("lists the corridors held this siege", () => {
        expect(getCorridorView(hold, readAfter, 7, true)).toEqual({
            artifacts: ["1001", "1002"],
            unknown: false,
        })
        expect(
            getCorridorView({ ...hold, artifacts: [] }, undefined, 7, true),
        ).toEqual({ artifacts: [], unknown: false })
    })

    // Login sends no entrances: the game sends them only in the Abyss.
    it("is unknown until the entrances are read after the siege", () => {
        expect(getCorridorView(hold, undefined, 7, true)).toEqual({
            artifacts: ["1001", "1002"],
            unknown: true,
        })
        expect(
            getCorridorView(hold, { ...readAfter, at: 500 }, 7, true)?.unknown,
        ).toBe(true)
    })

    it("knows nothing since the siege without its holdings", () => {
        expect(getCorridorView(hold, readAfter, 8, true)).toEqual({
            artifacts: null,
            unknown: true,
        })
        expect(getCorridorView(undefined, undefined, 8, true)).toEqual({
            artifacts: null,
            unknown: true,
        })
    })

    it("never warns without the companion", () => {
        expect(getCorridorView(hold, undefined, 7, false)).toEqual({
            artifacts: ["1001", "1002"],
            unknown: false,
        })
    })

    it("leaves the task as set up without the companion", () => {
        expect(getCorridorView(hold, undefined, 8, false)).toBeNull()
        expect(getCorridorView(undefined, undefined, 8, false)).toBeNull()
    })
})

describe("withCorridorView", () => {
    const groups: TaskGroup[] = [
        {
            reset: "siege",
            label: "Artifact Siege",
            tasks: [
                {
                    id: "corridors",
                    name: "Corridors",
                    subtitle: "Artifact Siege",
                    reset: "siege",
                    cap: 1,
                    shared: false,
                },
            ],
        },
        {
            reset: "daily",
            label: "Daily",
            tasks: [
                {
                    id: "x",
                    name: "X",
                    reset: "daily",
                    cap: 1,
                    shared: false,
                },
            ],
        },
    ]

    it("gives each held corridor its own 0/1 row", () => {
        const next = withCorridorView(groups, ["1001", "1002"])

        expect(next[0].tasks).toEqual([
            expect.objectContaining({
                id: "corridors:1001",
                name: "Abyss Corridor",
                subtitle: "Reshanta's Root",
                reset: "siege",
                cap: 1,
            }),
            expect.objectContaining({
                id: "corridors:1002",
                name: "Abyss Corridor",
                subtitle: "Sulfur Tree Island",
                cap: 1,
            }),
        ])
        expect(next[1]).toBe(groups[1])
    })

    it("says when none is held", () => {
        expect(withCorridorView(groups, [])[0].tasks).toEqual([
            expect.objectContaining({
                id: "corridors",
                cap: 0,
                subtitle: "None held",
            }),
        ])
    })

    it("leaves the task as set up while the holdings are unknown", () => {
        expect(withCorridorView(groups, null)).toBe(groups)
        expect(withCorridorView(groups, undefined)).toBe(groups)
    })
})

describe("getCorridorsUsed", () => {
    it("lists held corridors no longer open", () => {
        expect(getCorridorsUsed(hold, readAfter)).toEqual(["1001"])
    })

    it("is unknown without entrances read since the siege", () => {
        expect(getCorridorsUsed(hold, undefined)).toBeNull()
        expect(
            getCorridorsUsed(hold, { period: 7, at: 500, artifacts: [] }),
        ).toBeNull()
    })
})

it("names a corridor it doesn't know by its artifact", () => {
    expect(getCorridorName("2001")).toBe("Corridor 2001")
})
