import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { usePetCollection } from "./usePetCollection"

const setup = () => {
    return renderHook(() => {
        return usePetCollection()
    }).result
}

describe("usePetCollection", () => {
    it("sets a level and clears souls from the old one", () => {
        const result = setup()

        act(() => {
            result.current.changeSouls([{ petId: 1, souls: 40 }])
        })
        act(() => {
            result.current.changeLevel(1, 3)
        })

        expect(result.current.levels[1]).toBe(3)
        expect(result.current.souls[1]).toBeUndefined()
    })

    it("locks a pet again at level 0", () => {
        const result = setup()

        act(() => {
            result.current.changeLevel(1, 2)
        })
        act(() => {
            result.current.changeLevel(1, 0)
        })

        expect(result.current.levels[1]).toBeUndefined()
    })

    it("works levels out from souls, for many pets at once", () => {
        const result = setup()

        act(() => {
            result.current.changeSouls([
                { petId: 1, souls: 3 },
                { petId: 2, souls: 5 },
                { petId: 3, souls: 30 },
                { petId: 4, souls: 105 },
            ])
        })

        expect(result.current.levels).toEqual({ 2: 1, 3: 2, 4: 3 })
        expect(result.current.souls).toEqual({ 1: 3, 2: 5, 3: 30, 4: 105 })
    })

    it("drops a pet's level when its souls fall below Lv1", () => {
        const result = setup()

        act(() => {
            result.current.changeLevel(1, 2)
        })
        act(() => {
            result.current.changeSouls([{ petId: 1, souls: 4 }])
        })

        expect(result.current.levels[1]).toBeUndefined()
        expect(result.current.souls[1]).toBe(4)
    })

    it("hides and shows levels, kept in order", () => {
        const result = setup()

        act(() => {
            result.current.changeLevelHidden(3, true)
        })
        act(() => {
            result.current.changeLevelHidden(1, true)
        })
        expect(result.current.hiddenLevels).toEqual([1, 3])

        act(() => {
            result.current.changeLevelHidden(3, false)
        })
        expect(result.current.hiddenLevels).toEqual([1])
    })

    it("saves its panel states", () => {
        const result = setup()

        act(() => {
            result.current.changeMinimized(true)
            result.current.changeListMinimized(true)
            result.current.dismissTip()
        })

        expect(result.current.minimized).toBe(true)
        expect(result.current.listMinimized).toBe(true)
        expect(result.current.tipDismissed).toBe(true)
    })

    it("keeps two open copies in step", () => {
        const first = setup()
        const second = setup()

        act(() => {
            first.current.changeLevel(7, 2)
        })

        expect(second.current.levels[7]).toBe(2)
    })

    it("persists across a reload", () => {
        const first = setup()

        act(() => {
            first.current.changeSouls([{ petId: 9, souls: 40 }])
        })

        expect(
            JSON.parse(
                localStorage.getItem("daevanion:pets:v1:collection") ?? "{}",
            ),
        ).toMatchObject({ levels: { 9: 2 }, souls: { 9: 40 } })
    })
})
