import { act, renderHook } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { readSavedBoards } from "@planner/storage/boardStorage"
import { makeLayout } from "@test/boardFixture"
import { useLatestCallback } from "./useLatestCallback"
import { useManualBoard } from "./useManualBoard"

describe("useLatestCallback", () => {
    it("keeps one function that runs the latest callback", () => {
        const first = vi.fn()
        const second = vi.fn()
        const { result, rerender } = renderHook(
            ({ callback }) => {
                return useLatestCallback(callback)
            },
            { initialProps: { callback: first } },
        )
        const stable = result.current

        rerender({ callback: second })
        result.current("arg")

        expect(result.current).toBe(stable)
        expect(first).not.toHaveBeenCalled()
        expect(second).toHaveBeenCalledWith("arg")
    })
})

describe("useManualBoard", () => {
    const layout = makeLayout()

    const setup = (availablePoints = 10) => {
        const setMessage = vi.fn()
        const cancelOptimization = vi.fn()
        const persistProgress = vi.fn<(progress: object) => string | null>(
            () => {
                return null
            },
        )
        const { result } = renderHook(() => {
            const [selectedCells, setSelectedCells] = useState(
                new Set<string>(),
            )

            return useManualBoard({
                classId: "gladiator",
                layoutName: "nezekan",
                layout: layout,
                start: { row: 0, column: 0 },
                progress: {
                    selectedCells: selectedCells,
                    setSelectedCells: setSelectedCells,
                    persistProgress: persistProgress,
                } as never,
                availablePoints: availablePoints,
                initialUndo: null,
                initialSaved: [],
                excludeStart: (keys) => {
                    return keys.filter((key) => key !== "0,0")
                },
                setMessage: setMessage,
                cancelOptimization: cancelOptimization,
            })
        })

        return {
            result: result,
            setMessage: setMessage,
            persistProgress: persistProgress,
            cancelOptimization: cancelOptimization,
        }
    }

    it("selects a path and tracks points", () => {
        const { result, persistProgress } = setup()

        act(() => {
            result.current.selectCell({ row: 0, column: 2 })
        })

        expect(result.current.spentPoints).toBe(4)
        expect(result.current.remainingPoints).toBe(6)
        expect(persistProgress).toHaveBeenCalledWith({
            selectedCells: expect.arrayContaining(["0,1", "0,2"]),
        })
    })

    it("refuses what the remaining points can't pay for", () => {
        const { result, setMessage } = setup(3)

        act(() => {
            result.current.selectCell({ row: 0, column: 2 })
        })

        expect(result.current.spentPoints).toBe(0)
        expect(setMessage).toHaveBeenLastCalledWith(
            "That path costs 4 points, but only 3 remain.",
        )
    })

    it("shows a save failure over the selection's message", () => {
        const { result, setMessage, persistProgress } = setup()

        persistProgress.mockReturnValue("Could not save")

        act(() => {
            result.current.selectCell({ row: 0, column: 1 })
        })

        expect(setMessage).toHaveBeenLastCalledWith("Could not save")
    })

    it("resets and can undo the reset", () => {
        const { result } = setup()

        act(() => {
            result.current.selectCell({ row: 0, column: 1 })
        })
        act(() => {
            result.current.resetSelection()
        })

        expect(result.current.selectedCells.size).toBe(0)
        expect(result.current.boardUndo).toEqual({ selectedCells: ["0,1"] })

        act(() => {
            result.current.restoreSelection()
        })

        expect([...result.current.selectedCells]).toEqual(["0,1"])
        expect(result.current.boardUndo).toBeNull()
    })

    it("needs a name to save", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.saveBoard()
        })

        expect(setMessage).toHaveBeenLastCalledWith(
            "Enter a name before saving this board.",
        )
        expect(result.current.savedBoards).toEqual([])
    })

    it("saves, trimming the name and clearing the field", () => {
        const { result, setMessage } = setup()

        act(() => {
            result.current.selectCell({ row: 0, column: 1 })
            result.current.setBoardSaveName("  Mine  ")
        })
        act(() => {
            result.current.saveBoard()
        })

        expect(result.current.savedBoards[0]).toMatchObject({
            name: "Mine",
            selectedCells: ["0,1"],
            availablePoints: 10,
        })
        expect(result.current.boardSaveName).toBe("")
        expect(setMessage).toHaveBeenLastCalledWith('Saved "Mine".')
        expect(readSavedBoards("gladiator", "nezekan").value).toHaveLength(1)
    })

    it("loads a saved board, leaving out the start and stopping a search", () => {
        const { result, cancelOptimization, setMessage } = setup()

        act(() => {
            result.current.loadBoard({
                id: "a",
                name: "Old",
                createdAt: 1,
                availablePoints: 10,
                selectedCells: ["0,0", "0,1"],
            })
        })

        expect([...result.current.selectedCells]).toEqual(["0,1"])
        expect(cancelOptimization).toHaveBeenCalled()
        expect(setMessage).toHaveBeenLastCalledWith('Loaded "Old".')
    })

    it("renames and deletes saved boards", () => {
        const { result } = setup()

        act(() => {
            result.current.setBoardSaveName("Mine")
        })
        act(() => {
            result.current.saveBoard()
        })

        const id = result.current.savedBoards[0].id

        act(() => {
            result.current.renameBoard(id, "Renamed")
        })
        expect(result.current.savedBoards[0].name).toBe("Renamed")

        act(() => {
            result.current.deleteBoard(id)
        })
        expect(result.current.savedBoards).toEqual([])
        expect(readSavedBoards("gladiator", "nezekan").value).toEqual([])
    })
})
