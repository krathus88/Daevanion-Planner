// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import {
    readSavedBoards,
    readSavedPlanners,
    writeSavedBoards,
    writeSavedPlanners,
    type SavedBoard,
    type SavedPlanner,
} from "./boardStorage"
import { addSavedEntries, newSavedEntries } from "./savedEntries"

const CLASS = "gladiator"
const BOARD = "nezekan"

const planner = (id: string, cells: string[], cost = 4): SavedPlanner => {
    return {
        id: id,
        name: id,
        createdAt: 1,
        availablePoints: 50,
        targetCells: cells,
        plannedPath: cells,
        plannedCost: cost,
    }
}

const board = (id: string, cells: string[]): SavedBoard => {
    return {
        id: id,
        name: id,
        createdAt: 1,
        availablePoints: 50,
        selectedCells: cells,
    }
}

afterEach(() => {
    localStorage.clear()
})

describe("newSavedEntries", () => {
    it("keeps entries that aren't saved yet", () => {
        const fresh = newSavedEntries(
            CLASS,
            BOARD,
            [planner("a", ["0,0"])],
            [board("b", ["0,0"])],
        )

        expect(fresh.planners).toHaveLength(1)
        expect(fresh.boards).toHaveLength(1)
    })

    it("matches saved ones by id", () => {
        writeSavedPlanners(CLASS, BOARD, [planner("a", ["0,0"])])

        expect(
            newSavedEntries(CLASS, BOARD, [planner("a", ["5,5"])], []).planners,
        ).toEqual([])
    })

    it("matches saved ones by nodes, in any order", () => {
        writeSavedPlanners(CLASS, BOARD, [planner("a", ["0,0", "0,1"])])
        writeSavedBoards(CLASS, BOARD, [board("b", ["0,0", "0,1"])])

        const fresh = newSavedEntries(
            CLASS,
            BOARD,
            [planner("c", ["0,1", "0,0"])],
            [board("d", ["0,1", "0,0"])],
        )

        expect(fresh).toEqual({ planners: [], boards: [] })
    })

    it("tells routes of different cost apart", () => {
        writeSavedPlanners(CLASS, BOARD, [planner("a", ["0,0"], 4)])

        expect(
            newSavedEntries(CLASS, BOARD, [planner("b", ["0,0"], 5)], [])
                .planners,
        ).toHaveLength(1)
    })

    it("drops repeats within the import", () => {
        expect(
            newSavedEntries(
                CLASS,
                BOARD,
                [],
                [board("a", ["0,0"]), board("b", ["0,0"])],
            ).boards,
        ).toHaveLength(1)
    })

    it("throws when saved data can't be read", () => {
        localStorage.setItem(`daevanion:v1:${CLASS}:${BOARD}:saved-boards`, "{")

        expect(() => {
            return newSavedEntries(CLASS, BOARD, [], [])
        }).toThrow("Could not read")
    })
})

describe("addSavedEntries", () => {
    it("puts new entries first", () => {
        writeSavedBoards(CLASS, BOARD, [board("old", ["0,0"])])

        expect(
            addSavedEntries(CLASS, BOARD, [], [board("new", ["0,1"])]),
        ).toBeNull()
        expect(
            readSavedBoards(CLASS, BOARD).value?.map((entry) => entry.id),
        ).toEqual(["new", "old"])
    })

    it("writes nothing with nothing to add", () => {
        expect(addSavedEntries(CLASS, BOARD, [], [])).toBeNull()
        expect(readSavedPlanners(CLASS, BOARD).value).toBeNull()
    })

    it("returns read errors instead of overwriting", () => {
        localStorage.setItem(`daevanion:v1:${CLASS}:${BOARD}:saved-boards`, "{")

        expect(
            addSavedEntries(CLASS, BOARD, [], [board("a", ["0,0"])]),
        ).toContain("Could not read")
    })
})
