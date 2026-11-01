import { describe, expect, it } from "vitest"
import { PET_BOSSES } from "@pets/config/petBosses"
import type { Pet } from "@pets/data/petAtlas"
import { describePetSpawns, getBossText, getNoSpawnText } from "./petLabels"

const pet = (id: number, source: Pet["source"] = "field") => {
    return { id: id, source: source } as unknown as Pet
}

const bossEntry = (confirmed: boolean) => {
    const entry = Object.entries(PET_BOSSES).find(([, boss]) => {
        return boss.confirmed === confirmed
    })

    return entry ? { id: Number(entry[0]), boss: entry[1] } : null
}

const NOT_A_BOSS = 999_999_999

describe("getBossText", () => {
    it("is null for a pet that isn't a boss's", () => {
        expect(getBossText(pet(NOT_A_BOSS))).toBeNull()
    })

    it("names a confirmed boss", () => {
        const entry = bossEntry(true)

        if (entry) {
            expect(getBossText(pet(entry.id))).toBe(
                `${entry.boss.dungeon} boss`,
            )
        }
    })

    it("marks an unconfirmed boss", () => {
        const entry = bossEntry(false)

        if (entry) {
            expect(getBossText(pet(entry.id))).toContain("(unconfirmed)")
        }
    })
})

describe("getNoSpawnText", () => {
    it.each([
        ["field", "No tracked spawns"],
        ["other", "No open-world spawn: shop, quest, chest or dungeon"],
        ["special", "Special pet: no open-world spawn"],
    ] as const)("explains a %s pet", (source, text) => {
        expect(getNoSpawnText(pet(NOT_A_BOSS, source))).toBe(text)
    })
})

describe("describePetSpawns", () => {
    it("lists maps in map order", () => {
        expect(
            describePetSpawns(pet(NOT_A_BOSS), { altgard: 69, verteron: 377 }),
        ).toBe("Verteron 377 · Altgard 69")
    })

    it("skips maps with none", () => {
        expect(describePetSpawns(pet(NOT_A_BOSS), { verteron: 0 })).toBe(
            "No tracked spawns",
        )
    })

    it("explains non-field pets", () => {
        expect(describePetSpawns(pet(NOT_A_BOSS, "special"), {})).toBe(
            "Special pet: no open-world spawn",
        )
    })

    it("adds the boss for a field pet that's also one", () => {
        const entry = Object.entries(PET_BOSSES)[0]

        expect(describePetSpawns(pet(Number(entry[0])), { verteron: 2 })).toBe(
            `Verteron 2 · ${getBossText(pet(Number(entry[0])))}`,
        )
    })
})
