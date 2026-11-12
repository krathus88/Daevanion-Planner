import { layouts } from "@planner/config/layouts"
import { describe, expect, it } from "vitest"
import { pickCheckedBoards, toGameReadings } from "./gameBoards"

describe("toGameReadings", () => {
    it("places a main board two cells into the game's 15 x 15 grid", () => {
        // 33 is the grid's row 2, column 2: Nezekan's top left corner; 113 is
        // its start node (5,5), 183 its bottom left (10,0).
        const readings = toGameReadings({ "1": [33, 113, 183] })

        expect(readings).toEqual({ nezekan: ["0,0", "5,5", "10,0"] })
        expect(layouts.nezekan.grid[5][5]).toBe("S")
    })

    it("places Triniel one cell in and Ariel at the corner", () => {
        // Triniel's start (6,6) and Ariel's (7,7).
        const readings = toGameReadings({ "4": [17, 113], "5": [1, 113] })

        expect(readings.triniel).toEqual(["0,0", "6,6"])
        expect(readings.ariel).toEqual(["0,0", "7,7"])
    })

    it("leaves out Azphel, cells off the board and gaps", () => {
        // 1 lies outside Nezekan's grid; 36 is its (0,3), a gap.
        const readings = toGameReadings({ "1": [1, 36], "6": [13] })

        expect(layouts.nezekan.grid[0][3]).toBe(".")
        expect(readings).toEqual({ nezekan: [] })
    })
})

describe("pickCheckedBoards", () => {
    const readings = toGameReadings({ "1": [33], "2": [33], "5": [1] })

    it("reads only the open board from This board", () => {
        expect(pickCheckedBoards(readings, "board", "zikel")).toEqual(["zikel"])
        expect(pickCheckedBoards(readings, "board", "triniel")).toEqual([])
    })

    it("reads every board the game sent from All boards", () => {
        expect(pickCheckedBoards(readings, "all", "zikel")).toEqual([
            "nezekan",
            "zikel",
            "ariel",
        ])
    })
})
