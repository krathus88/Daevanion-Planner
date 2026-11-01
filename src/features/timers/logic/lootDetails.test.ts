import { describe, expect, it } from "vitest"
import type {
    ArtworkStat,
    ChestReward,
    LootDrop,
    LootPiece,
} from "@timers/config/fieldBossLoot"
import { PANTHEON_STATS } from "@config/stats/pantheonStats"
import {
    getBindingLabel,
    getChestRows,
    getLootChanceLabel,
    getPieceRows,
    getSetTitle,
    getStatRows,
    isBoundLoot,
} from "./lootDetails"

const drop = (overrides: object) => {
    return { name: "Item", chance: 50, ...overrides } as unknown as LootDrop
}

const piece = (name: string, itemLevel: number) => {
    return {
        name: name,
        chance: 10,
        itemLevel: itemLevel,
    } as unknown as LootPiece
}

describe("getLootChanceLabel", () => {
    it("covers each kind of drop", () => {
        expect(getLootChanceLabel(drop({ chance: 100 }))).toBe(
            "guaranteed for the top-damage party",
        )
        expect(getLootChanceLabel(drop({ chance: 25 }))).toBe(
            "25% per kill, top-damage party only",
        )
        expect(getLootChanceLabel(drop({ everyone: true, amount: 3 }))).toBe(
            "50% per kill ×3, for every player with contribution",
        )
        expect(getLootChanceLabel(drop({ everyone: true }))).toBe(
            "50% per kill, for every player with contribution",
        )
    })
})

describe("binding", () => {
    it("reads it from the item's name", () => {
        expect(isBoundLoot(drop({ name: "Sword (Bound)" }))).toBe(true)
        expect(isBoundLoot(drop({ name: "Sword" }))).toBe(false)
    })

    it("labels each kind", () => {
        expect(getBindingLabel(drop({ name: "Sword" }))).toBe(
            "Unbound, tradeable",
        )
        expect(getBindingLabel(drop({ name: "Sword (Bound)" }))).toBe(
            "Bound, can't be traded",
        )
        expect(
            getBindingLabel(drop({ name: "Chest (Bound)", contents: [] })),
        ).toBe("Bound, as is everything inside")
    })
})

describe("getSetTitle / getPieceRows", () => {
    it("shows a shared item level once", () => {
        const pieces = [piece("A", 70), piece("B", 70)]

        expect(getSetTitle(pieces)).toBe("One of 2 · ilvl 70:")
        expect(getPieceRows(pieces)[0]).toEqual({
            label: "A",
            value: "10%",
            detail: undefined,
        })
    })

    it("shows differing levels per piece", () => {
        const pieces = [piece("A", 70), piece("B", 80)]

        expect(getSetTitle(pieces)).toBe("One of 2:")
        expect(getPieceRows(pieces)[1].detail).toBe("ilvl 80")
    })
})

describe("getChestRows", () => {
    const reward = (overrides: object) => {
        return { name: "R", chance: 5, ...overrides } as unknown as ChestReward
    }

    it("shows an amount", () => {
        expect(getChestRows([reward({ amount: 3 })])[0].detail).toBe("×3")
    })

    it("shows a set of pieces with its children", () => {
        const [row] = getChestRows([
            reward({ pieces: [piece("A", 70), piece("B", 70)] }),
        ])

        expect(row.detail).toBe("1 of 2 · ilvl 70")
        expect(row.children).toHaveLength(2)
    })

    it("leaves the level out of a mixed set", () => {
        const [row] = getChestRows([
            reward({ pieces: [piece("A", 70), piece("B", 80)] }),
        ])

        expect(row.detail).toBe("1 of 2")
    })

    it("shows nothing extra for a plain reward", () => {
        const [row] = getChestRows([reward({})])

        expect(row.detail).toBeUndefined()
        expect(row.children).toBeUndefined()
    })
})

describe("getStatRows", () => {
    it("works effects out from the stat's value", () => {
        const name = Object.keys(PANTHEON_STATS)[0]
        const [effect] = PANTHEON_STATS[name]
        const [row] = getStatRows([
            { name: name, value: 2 } as unknown as ArtworkStat,
        ])
        const expected = Number((effect.perPoint * 2).toFixed(2))

        expect(row.detail).toBe("+2")
        expect(row.valueTone).toBe("effect")
        expect(row.value).toContain(`${expected}% ${effect.name}`)
    })

    it("trims a bracketed suffix from the label", () => {
        const [row] = getStatRows([
            { name: "Power [Gold]", value: 1 } as unknown as ArtworkStat,
        ])

        expect(row.label).toBe("Power")
        expect(row.value).toBe("")
    })
})
