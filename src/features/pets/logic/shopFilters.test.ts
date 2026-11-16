import { describe, expect, it } from "vitest"
import { makeAtlas, makeMonster, spawnsAt } from "@test/petFixture"
import type { ShopPet } from "./shopCheck"
import {
    countShopSources,
    filterShopPets,
    getShopSourceName,
    getShopSources,
    SHOP_SOURCE_IDS,
} from "./shopFilters"

// Harcon, a Krao Cave boss (petBosses.ts).
const DUNGEON_PET_ID = 1077

const fixture = makeAtlas([
    { source: "other" },
    { monsters: [makeMonster(spawnsAt(0, 0, 3), { map: "altgard" })] },
    {
        monsters: [
            makeMonster(spawnsAt(0, 0, 3), { map: "altgard" }),
            makeMonster(spawnsAt(0, 0, 3), { map: "verteron" }),
        ],
    },
    { monsters: [makeMonster([], { map: "verteron" })] },
    { source: "other" },
    {
        monsters: [
            makeMonster(spawnsAt(0, 0, 3), {
                map: "verteron",
                fieldBoss: true,
            }),
        ],
    },
    {
        monsters: [
            makeMonster(spawnsAt(0, 0, 3), {
                map: "verteron",
                fieldBoss: true,
            }),
            makeMonster(spawnsAt(0, 0, 3), { map: "verteron" }),
        ],
    },
])
const atlas = {
    ...fixture,
    pets: fixture.pets.map((pet, index) => {
        return index === 4 ? { ...pet, id: DUNGEON_PET_ID } : pet
    }),
}
const [
    notWild,
    oneMap,
    twoMaps,
    emptyMonster,
    dungeon,
    fieldBoss,
    bossAndNormal,
] = atlas.pets

const items = atlas.pets.map((pet) => {
    return { pet: pet } as ShopPet
})

describe("getShopSources", () => {
    it("tags each map a pet spawns on", () => {
        expect(getShopSources(atlas, oneMap)).toEqual(["altgard"])
        expect(getShopSources(atlas, twoMaps)).toEqual(["verteron", "altgard"])
    })

    it("tags pets with no spawns as not in the wild", () => {
        expect(getShopSources(atlas, notWild)).toEqual(["notWild"])
        expect(getShopSources(atlas, emptyMonster)).toEqual(["notWild"])
    })

    it("tags dungeon bosses", () => {
        expect(getShopSources(atlas, dungeon)).toEqual(["notWild", "dungeon"])
    })

    it("tags pets only field bosses drop", () => {
        expect(getShopSources(atlas, fieldBoss)).toEqual([
            "verteron",
            "fieldBoss",
        ])
        expect(getShopSources(atlas, bossAndNormal)).toEqual(["verteron"])
    })
})

describe("getShopSourceName", () => {
    it("names each kind like the companion", () => {
        expect(getShopSourceName("notWild")).toBe("Not in the wild")
        expect(getShopSourceName("reshanta")).toBe("Lower Reshanta")
        expect(getShopSourceName("outerReshanta")).toBe("Outer Reshanta")
        expect(getShopSourceName("dungeon")).toBe("Dungeon")
        expect(getShopSourceName("fieldBoss")).toBe("Field boss")
    })

    it("names every source", () => {
        for (const source of SHOP_SOURCE_IDS) {
            expect(getShopSourceName(source)).toBeTruthy()
        }
    })
})

describe("countShopSources", () => {
    it("counts a pet under each of its sources", () => {
        expect(countShopSources(atlas, items)).toEqual({
            verteron: 3,
            reshanta: 0,
            outerReshanta: 0,
            altgard: 2,
            notWild: 3,
            dungeon: 1,
            fieldBoss: 1,
        })
    })
})

describe("filterShopPets", () => {
    it("keeps everything with nothing picked", () => {
        expect(filterShopPets(atlas, items, [])).toBe(items)
    })

    it("keeps pets with any picked source", () => {
        const kept = filterShopPets(atlas, items, ["altgard", "dungeon"])

        expect(kept.map((item) => item.pet)).toEqual([oneMap, twoMaps, dungeon])
    })

    it("keeps a pet on several maps under any of them", () => {
        const kept = filterShopPets(atlas, items, ["altgard"])

        expect(kept.map((item) => item.pet)).toContain(twoMaps)
    })
})
