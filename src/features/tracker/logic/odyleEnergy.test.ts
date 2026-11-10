import { describe, expect, it } from "vitest"
import {
    clampEnergy,
    getCubeCost,
    getEnergyCap,
    getEnergyLevel,
    getEnergyPeriod,
    getNextRecharge,
    readEnergy,
    spendEnergy,
} from "./odyleEnergy"

describe("getNextRecharge", () => {
    it("comes every 3 hours in step with the daily reset", () => {
        // 22:16 UTC, when the game counted 2h45m to the next recharge.
        expect(getNextRecharge(Date.UTC(2026, 10, 9, 22, 16))).toBe(
            Date.UTC(2026, 10, 10, 1),
        )
        expect(getNextRecharge(Date.UTC(2026, 10, 4, 6, 59))).toBe(
            Date.UTC(2026, 10, 4, 7),
        )
    })

    it("moves the period on 8 times a day", () => {
        const morning = getEnergyPeriod(Date.UTC(2026, 10, 4, 7))

        expect(getEnergyPeriod(Date.UTC(2026, 10, 4, 6, 59))).toBe(morning - 1)
        expect(getEnergyPeriod(Date.UTC(2026, 10, 5, 7))).toBe(morning + 8)
    })
})

describe("getEnergyCap", () => {
    it("is 840 with the membership, 560 without", () => {
        expect(getEnergyCap(true)).toBe(840)
        expect(getEnergyCap(false)).toBe(560)
    })
})

describe("getCubeCost", () => {
    it("is 80 with the membership, 40 without", () => {
        expect(getCubeCost(true)).toBe(80)
        expect(getCubeCost(false)).toBe(40)
    })
})

describe("readEnergy", () => {
    it("starts full", () => {
        expect(readEnergy(undefined, 5, 840)).toEqual({ base: 840, bonus: 0 })
    })

    it("recharges 15 every 3 hours up to the cap, extra energy aside", () => {
        const saved = { period: 10, base: 800, bonus: 500 }

        expect(readEnergy(saved, 10, 840)).toEqual({ base: 800, bonus: 500 })
        expect(readEnergy(saved, 11, 840)).toEqual({ base: 815, bonus: 500 })
        expect(readEnergy(saved, 13, 840)).toEqual({ base: 840, bonus: 500 })
        expect(readEnergy(saved, 13, 560)).toEqual({ base: 560, bonus: 500 })
    })
})

describe("clampEnergy", () => {
    it("keeps the extra energy up to 2000", () => {
        expect(clampEnergy({ base: 900, bonus: 2500 }, 840)).toEqual({
            base: 840,
            bonus: 2000,
        })
        expect(clampEnergy({ base: -5, bonus: 1.4 }, 840)).toEqual({
            base: 0,
            bonus: 1,
        })
    })
})

describe("spendEnergy", () => {
    it("spends the recharged energy first, then the extra", () => {
        expect(spendEnergy({ base: 100, bonus: 50 }, 40)).toEqual({
            base: 60,
            bonus: 50,
        })
        expect(spendEnergy({ base: 25, bonus: 50 }, 40)).toEqual({
            base: 0,
            bonus: 35,
        })
    })

    it("stops at 0", () => {
        expect(spendEnergy({ base: 10, bonus: 5 }, 40)).toEqual({
            base: 0,
            bonus: 0,
        })
    })
})

describe("getEnergyLevel", () => {
    it("is capped at the cap, soon within 2 recharges, else ok", () => {
        expect(getEnergyLevel(840, 840)).toBe("capped")
        expect(getEnergyLevel(810, 840)).toBe("soon")
        expect(getEnergyLevel(809, 840)).toBe("ok")
        expect(getEnergyLevel(560, 560)).toBe("capped")
    })
})
