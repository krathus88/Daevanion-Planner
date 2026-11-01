import { describe, expect, it } from "vitest"
import { makeLayout } from "@test/boardFixture"
import { compareWithGame, gapsByCell } from "./gameGaps"

const layout = makeLayout()

describe("compareWithGame", () => {
    it("finds nothing when game and plan agree", () => {
        expect(compareWithGame(layout, ["0,1"], new Set(["0,1"]))).toEqual({
            missing: [],
            extra: [],
        })
    })

    it("splits planned-only from acquired-only nodes", () => {
        expect(compareWithGame(layout, ["0,2"], new Set(["0,1"]))).toEqual({
            missing: ["0,1"],
            extra: ["0,2"],
        })
    })

    it("never counts the start node or gaps in the grid", () => {
        expect(
            compareWithGame(layout, ["0,0", "1,0"], new Set(["0,0", "1,0"])),
        ).toEqual({ missing: [], extra: [] })
    })

    it("lists gaps in grid order, whatever order they came in", () => {
        expect(
            compareWithGame(layout, [], new Set(["2,2", "0,1", "1,1"])).missing,
        ).toEqual(["0,1", "1,1", "2,2"])
    })
})

describe("gapsByCell", () => {
    it("labels each cell with its gap", () => {
        const cells = gapsByCell({ missing: ["0,1"], extra: ["0,2"] })

        expect(cells.get("0,1")).toBe("missing")
        expect(cells.get("0,2")).toBe("extra")
        expect(cells.has("1,1")).toBe(false)
    })
})
