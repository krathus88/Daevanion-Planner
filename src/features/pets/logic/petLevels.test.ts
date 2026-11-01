import { describe, expect, it } from "vitest"
import {
    getLevelNeeded,
    getLevelStart,
    getPetLevel,
    getPetSouls,
    getProgressText,
    isPetLevel,
    isPetSouls,
    levelFromSouls,
} from "./petLevels"

describe("levelFromSouls", () => {
    it.each([
        [0, 0],
        [4, 0],
        [5, 1],
        [29, 1],
        [30, 2],
        [104, 2],
        [105, 3],
    ])("%d souls is level %d", (souls, level) => {
        expect(levelFromSouls(souls)).toBe(level)
    })
})

describe("level sizes", () => {
    it("starts levels at 5, 30 and 105 souls", () => {
        expect([1, 2, 3].map(getLevelStart)).toEqual([5, 30, 105])
    })

    it("needs 5, 25 and 75 souls per level", () => {
        expect([0, 1, 2].map(getLevelNeeded)).toEqual([5, 25, 75])
    })
})

describe("validators", () => {
    it.each([1, 2, 3])("accepts level %d", (level) => {
        expect(isPetLevel(level)).toBe(true)
    })

    it.each([0, 4, "1", null])("rejects level %s", (level) => {
        expect(isPetLevel(level)).toBe(false)
    })

    it.each([0, 105])("accepts %d souls", (souls) => {
        expect(isPetSouls(souls)).toBe(true)
    })

    it.each([-1, 106, 1.5, "5"])("rejects %s souls", (souls) => {
        expect(isPetSouls(souls)).toBe(false)
    })
})

describe("getProgressText", () => {
    it.each([
        [3, "3/5"],
        [5, "0/25"],
        [29, "24/25"],
        [81, "51/75"],
    ])("%d souls reads %s", (souls, text) => {
        expect(getProgressText(souls)).toBe(text)
    })

    it("is empty for a locked pet with no souls and at Lv3", () => {
        expect(getProgressText(0)).toBeNull()
        expect(getProgressText(105)).toBeNull()
    })
})

describe("saved values", () => {
    it("reads a missing pet as locked", () => {
        expect(getPetLevel({}, 7)).toBe(0)
        expect(getPetSouls({}, {}, 7)).toBe(0)
    })

    it("uses saved souls when there are some", () => {
        expect(getPetSouls({ 7: 2 }, { 7: 40 }, 7)).toBe(40)
    })

    it("counts a pet without souls as just reaching its level", () => {
        expect(getPetSouls({ 7: 2 }, {}, 7)).toBe(30)
    })
})
