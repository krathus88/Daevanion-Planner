import { beforeAll, describe, expect, it } from "vitest"
import { layouts } from "@planner/config/layouts"
import { loadScreenshot } from "@test/readPetScreenshot"
import { readBoardScreenshot } from "./boardScreenshot"

// src/test/screenshots/daevanion.jpg, checked by eye node by node. X is lit,
// o is blue or dark, S the start, a space no node.
const NEZEKAN = [
    "XXo ooo oXX",
    "X Xoo ooo X",
    "XXX XXo ooX",
    " X  X o X X",
    "oXXXXXXXXXX",
    "o  o S X  X",
    "XooXXXooooo",
    "X o X o  o ",
    "XXX XXo XXo",
    "X XXX XXX o",
    "ooo XXX Xoo",
]

const toRows = (acquired: string[]) => {
    const taken = new Set(acquired)

    return layouts.nezekan.grid.map((row, rowIndex) => {
        let text = ""

        for (let column = 0; column < row.length; column++) {
            const kind = row[column]

            if (kind === "." || kind === "S") {
                text += kind === "S" ? "S" : " "
            } else {
                text += taken.has(`${rowIndex},${column}`) ? "X" : "o"
            }
        }

        return text
    })
}

let reading: ReturnType<typeof readBoardScreenshot<keyof typeof layouts>>

beforeAll(async () => {
    reading = readBoardScreenshot(
        await loadScreenshot("daevanion.jpg"),
        layouts,
    )
})

describe("a real Daevanion screenshot", () => {
    it("recognizes the board from a full-screen shot", () => {
        expect(reading?.boardId).toBe("nezekan")
        expect(reading?.score).toBeGreaterThan(0.7)
    })

    it("reads every node: lit is acquired, blue and dark aren't", () => {
        expect(toRows(reading?.acquired ?? [])).toEqual(NEZEKAN)
    })

    it("counts what's acquired", () => {
        expect(reading?.acquired).toHaveLength(53)
    })
})
