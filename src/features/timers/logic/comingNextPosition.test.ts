import { describe, expect, it } from "vitest"
import {
    isComingNextPosition,
    placeComingNext,
    snapComingNext,
} from "./comingNextPosition"

const layout = {
    viewportWidth: 1000,
    viewportHeight: 800,
    headerBottom: 60,
    contentLeft: 100,
    contentRight: 900,
    width: 200,
    startGrowth: 0,
    endGrowth: 0,
    height: 40,
}

describe("isComingNextPosition", () => {
    it("accepts both docks", () => {
        expect(isComingNextPosition({ dock: "header", along: 0.5 })).toBe(true)
        expect(isComingNextPosition({ dock: "free", fx: 0, fy: 1 })).toBe(true)
    })

    it.each([
        null,
        { dock: "header" },
        { dock: "free", fx: 0 },
        { dock: "free", fx: Number.NaN, fy: 0 },
        { dock: "side", along: 0 },
    ])("rejects %j", (value) => {
        expect(isComingNextPosition(value)).toBe(false)
    })
})

describe("snapComingNext", () => {
    it("docks to the header within reach", () => {
        expect(snapComingNext(300, 70, layout).dock).toBe("header")
    })

    it("stores its place along the content width", () => {
        expect(snapComingNext(400, 60, layout)).toEqual({
            dock: "header",
            along: 0.5,
        })
    })

    it("floats further down as fractions of the viewport", () => {
        expect(snapComingNext(400, 380, layout)).toEqual({
            dock: "free",
            fx: 0.5,
            fy: 0.5,
        })
    })

    it("snaps to the viewport's and the content's edges", () => {
        expect(snapComingNext(10, 380, layout)).toMatchObject({ fx: 0 })
        expect(snapComingNext(790, 380, layout)).toMatchObject({ fx: 1 })
        expect(snapComingNext(400, 5, layout)).toMatchObject({ fy: 0 })
        expect(snapComingNext(400, 755, layout)).toMatchObject({ fy: 1 })
    })

    it("keeps a strip dragged past the edge on screen", () => {
        expect(snapComingNext(5000, 5000, layout)).toEqual({
            dock: "free",
            fx: 1,
            fy: 1,
        })
        expect(snapComingNext(-500, -500, layout)).toEqual({
            dock: "free",
            fx: 0,
            fy: 0,
        })
    })
})

describe("placeComingNext", () => {
    it("is the inverse of snapping", () => {
        const position = snapComingNext(400, 380, layout)

        expect(placeComingNext(position, layout)).toEqual({ x: 400, y: 380 })
    })

    it("hangs a docked strip from the header", () => {
        expect(placeComingNext({ dock: "header", along: 0.5 }, layout)).toEqual(
            { x: 400, y: 60 },
        )
    })

    it("keeps its fraction when the window shrinks", () => {
        expect(
            placeComingNext(
                { dock: "free", fx: 1, fy: 1 },
                { ...layout, viewportWidth: 500, viewportHeight: 400 },
            ),
        ).toEqual({ x: 300, y: 360 })
    })

    it("keeps its place as its controls unfold", () => {
        expect(
            placeComingNext(
                { dock: "header", along: 0.5 },
                { ...layout, startGrowth: 20, endGrowth: 30 },
            ),
        ).toEqual({ x: 400, y: 60 })
    })

    it("keeps unfolded controls on screen", () => {
        const unfolded = { ...layout, startGrowth: 20, endGrowth: 30 }

        expect(
            placeComingNext({ dock: "free", fx: 0, fy: 0 }, unfolded),
        ).toMatchObject({ x: 20 })
        expect(
            placeComingNext({ dock: "free", fx: 1, fy: 0 }, unfolded),
        ).toMatchObject({ x: 770 })
    })

    it("stays on screen in a window narrower than the strip", () => {
        expect(
            placeComingNext(
                { dock: "free", fx: 1, fy: 0 },
                { ...layout, viewportWidth: 100 },
            ),
        ).toMatchObject({ x: 0 })
    })
})
