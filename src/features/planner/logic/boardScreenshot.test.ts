import { describe, expect, it } from "vitest"
import { BOARD_IDS, type BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import { fillRect, makePixels, toRgb, type Color } from "@test/pixelFixture"
import { readBoardScreenshot } from "./boardScreenshot"

const GAP: Color = [8, 8, 10]
const LOCKED: Color = [36, 36, 38]
const NEXT: Color = [30, 60, 140]
const LIT: Color = [220, 190, 120]

type Scene = {
    board: BoardId
    acquired?: string[]
    next?: string[]
    pitch?: number
    margin?: number
}

// Draws a board the way the game shows it: nodes brighter than the gaps, lit
// once acquired, blue when they can be acquired next.
const drawBoard = ({
    board,
    acquired = [],
    next = [],
    pitch = 50,
    margin = 40,
}: Scene) => {
    const grid = layouts[board].grid
    const size = Math.max(grid.length, grid[0].length) * pitch + margin * 2
    const pixels = makePixels(size, size, GAP)
    const node = Math.round(pitch * 0.72)

    for (let row = 0; row < grid.length; row++) {
        for (let column = 0; column < grid[row].length; column++) {
            const kind = grid[row][column]
            const key = `${row},${column}`

            if (kind === ".") {
                continue
            }

            let color = LOCKED

            if (kind === "S" || acquired.includes(key)) {
                color = LIT
            } else if (next.includes(key)) {
                color = NEXT
            }

            fillRect(
                pixels,
                margin + column * pitch + Math.round((pitch - node) / 2),
                margin + row * pitch + Math.round((pitch - node) / 2),
                node,
                node,
                color,
            )
        }
    }

    return pixels
}

describe("readBoardScreenshot", () => {
    it.each(BOARD_IDS)("recognises %s by its shape", (board) => {
        const reading = readBoardScreenshot(
            drawBoard({ board: board }),
            layouts,
        )

        expect(reading?.boardId).toBe(board)
        expect(reading?.score).toBeGreaterThan(0.9)
    })

    it("reads which nodes are acquired, leaving out the start", () => {
        const reading = readBoardScreenshot(
            drawBoard({ board: "nezekan", acquired: ["0,0", "0,1", "4,5"] }),
            layouts,
        )

        expect(reading?.acquired).toEqual(["0,0", "0,1", "4,5"])
    })

    it("doesn't count blue nodes, which are only acquirable next", () => {
        const reading = readBoardScreenshot(
            drawBoard({
                board: "nezekan",
                acquired: ["0,0"],
                next: ["0,1", "1,0"],
            }),
            layouts,
        )

        expect(reading?.acquired).toEqual(["0,0"])
    })

    it("reads an untouched board as nothing acquired", () => {
        const reading = readBoardScreenshot(
            drawBoard({ board: "zikel" }),
            layouts,
        )

        expect(reading?.acquired).toEqual([])
    })

    it("works at other resolutions", () => {
        for (const pitch of [30, 70, 110]) {
            const reading = readBoardScreenshot(
                drawBoard({
                    board: "nezekan",
                    acquired: ["0,1"],
                    pitch: pitch,
                }),
                layouts,
            )

            expect(reading?.boardId, `pitch ${pitch}`).toBe("nezekan")
            expect(reading?.acquired, `pitch ${pitch}`).toEqual(["0,1"])
        }
    })

    it("reads 3-channel pixels too", () => {
        const reading = readBoardScreenshot(
            toRgb(drawBoard({ board: "vaizel" })),
            layouts,
        )

        expect(reading?.boardId).toBe("vaizel")
    })

    it("only considers the shapes it's given", () => {
        const reading = readBoardScreenshot(drawBoard({ board: "nezekan" }), {
            zikel: layouts.zikel,
        })

        expect(reading === null || reading.score < 0.9).toBe(true)
    })

    it("finds no board in a blank screenshot", () => {
        expect(readBoardScreenshot(makePixels(600, 600), layouts)).toBeNull()
    })

    it("finds no board in a screenshot of something else", () => {
        const pixels = makePixels(600, 600, [90, 90, 90])

        fillRect(pixels, 100, 100, 300, 200, [200, 40, 40])

        expect(readBoardScreenshot(pixels, layouts)).toBeNull()
    })
})
