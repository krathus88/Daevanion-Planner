import { describe, expect, it } from "vitest"
import type { TaskGroup } from "./trackerCards"
import {
    getCorridorName,
    getCorridorsUsed,
    getCorridorView,
    withCorridorView,
} from "./corridors"

const hold = { period: 7, at: 1000, artifacts: ["1001", "1002"] }

describe("getCorridorView", () => {
    it("names the corridors held this siege", () => {
        expect(getCorridorView(hold, 7, false)).toEqual({
            cap: 2,
            subtitle: "Reshanta's Root · Sulfur Tree Island",
        })
        expect(getCorridorView({ ...hold, artifacts: [] }, 7, true)).toEqual({
            cap: 0,
            subtitle: "None held",
        })
    })

    it("assumes none since the siege while the companion runs", () => {
        expect(getCorridorView(hold, 8, true)?.cap).toBe(0)
        expect(getCorridorView(undefined, 8, true)?.cap).toBe(0)
    })

    it("leaves the task as set up without the companion", () => {
        expect(getCorridorView(hold, 8, false)).toBeNull()
        expect(getCorridorView(undefined, 8, false)).toBeNull()
    })
})

describe("withCorridorView", () => {
    it("changes only the Corridors task", () => {
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
        const next = withCorridorView(groups, { cap: 2, subtitle: "Both" })

        expect(next[0].tasks[0]).toMatchObject({ cap: 2, subtitle: "Both" })
        expect(next[1]).toBe(groups[1])
        expect(withCorridorView(groups, null)).toBe(groups)
    })
})

describe("getCorridorsUsed", () => {
    it("counts held corridors no longer open", () => {
        expect(
            getCorridorsUsed(hold, {
                period: 7,
                at: 2000,
                artifacts: ["1002"],
            }),
        ).toBe(1)
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
