import { describe, expect, it } from "vitest"
import { makeCraftingSettings } from "@test/craftingFixture"
import {
    applyToCrafting,
    getOwnedItems,
    getProficiency,
} from "./applyToCrafting"
import type { GameSnapshot } from "./gameSnapshot"

const snapshot = (
    name: string,
    itemsAt: number,
    items: GameSnapshot["items"],
    bound: GameSnapshot["bound"] = {},
    server = 1301,
): GameSnapshot => {
    return {
        character: { name: name, server: server, class: 30 },
        items: items,
        bound: bound,
        itemsAt: itemsAt,
    }
}

describe("getOwnedItems", () => {
    it("adds every character's bag and Character Storage, and Server Storage once", () => {
        const owned = getOwnedItems(
            [
                snapshot("Old", 10, {
                    "1": { ore: 5 },
                    "15": { ore: 1 },
                    "2": { gem: 6 },
                }),
                snapshot("New", 20, {
                    "1": { ore: 2, log: 3 },
                    "2": { gem: 7 },
                    "11": { worn: 1 },
                }),
            ],
            "siel",
            null,
        )

        // Server Storage from the newest; equipped gear (11) left out.
        expect(owned).toEqual({ ore: 8, log: 3, gem: 7 })
    })

    it("counts soulbound items only for the chosen character", () => {
        const snapshots = [
            snapshot("Kept", 10, { "1": {} }, { "1": { ring: 1 } }),
            snapshot("Other", 20, { "1": {} }, { "15": { ring: 2 } }),
        ]

        expect(getOwnedItems(snapshots, "siel", "Kept")).toEqual({ ring: 1 })
        expect(getOwnedItems(snapshots, "siel", "Other")).toEqual({ ring: 2 })
        expect(getOwnedItems(snapshots, "siel", null)).toEqual({})
    })

    it("only counts characters on the server", () => {
        const owned = getOwnedItems(
            [
                snapshot("Here", 10, { "1": { ore: 1 } }),
                snapshot(
                    "There",
                    30,
                    { "1": { ore: 9 }, "2": { gem: 1 } },
                    {},
                    1302,
                ),
            ],
            "siel",
            null,
        )

        expect(owned).toEqual({ ore: 1 })
    })

    it("is null before any inventory arrived on the server", () => {
        expect(
            getOwnedItems(
                [{ character: { name: "x", server: 1301, class: 30 } }],
                "siel",
                null,
            ),
        ).toBeNull()
        expect(
            getOwnedItems([snapshot("x", 1, { "1": {} })], "nezekan", null),
        ).toBeNull()
    })
})

describe("applyToCrafting", () => {
    it("replaces the owned counts", () => {
        const settings = makeCraftingSettings({ owned: { "1": 5 } })
        const next = applyToCrafting(settings, [
            snapshot("New", 20, { "1": { "2": 4 } }),
        ])

        expect(next).toEqual({ ...settings, owned: { "2": 4 } })
    })

    it("uses the settings' server and character", () => {
        const settings = makeCraftingSettings({ character: "Kept" })
        const next = applyToCrafting(settings, [
            snapshot("Kept", 20, { "1": {} }, { "1": { ring: 1 } }),
        ])

        expect(next.owned).toEqual({ ring: 1 })
    })

    it("keeps the settings without an inventory", () => {
        const settings = makeCraftingSettings()

        expect(applyToCrafting(settings, [])).toBe(settings)
    })
})

// Kryx's levels (2026-11-12): Blacksmithing Professional 12, Handicrafting
// Professional 45.
const withLevels = (name: string, professions: Record<string, number>) => {
    return {
        character: { name: name, server: 1301, class: 30 },
        professions: professions,
        professionsAt: 1,
    }
}

describe("getProficiency", () => {
    it("names the chosen character's levels by profession", () => {
        expect(
            getProficiency(
                [
                    withLevels("Kryx", { "1": 62, "2": 2, "3": 95, "9": 4 }),
                    withLevels("Krathus", { "3": 52 }),
                ],
                "siel",
                "Kryx",
            ),
        ).toEqual({ blacksmithing: 62, armorsmithing: 2, handicrafting: 95 })
    })

    it("is null without that character's levels", () => {
        const snapshots = [withLevels("Kryx", { "1": 62 })]

        expect(getProficiency(snapshots, "siel", null)).toBeNull()
        expect(getProficiency(snapshots, "siel", "Krathus")).toBeNull()
        expect(getProficiency(snapshots, "nezekan", "Kryx")).toBeNull()
    })
})

describe("applyToCrafting: proficiency", () => {
    it("puts the character's levels over the typed ones", () => {
        const settings = {
            ...makeCraftingSettings(),
            server: "siel",
            character: "Kryx",
            proficiency: { blacksmithing: 30, cooking: 7 },
        }

        expect(
            applyToCrafting(settings, [withLevels("Kryx", { "1": 62 })])
                .proficiency,
        ).toEqual({ blacksmithing: 62, cooking: 7 })
    })
})
