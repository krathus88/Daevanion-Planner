import { describe, expect, it } from "vitest"
import { makeAtlas, makeMonster, spawnsAt } from "@test/petFixture"
import type { ShopPet } from "./shopCheck"
import {
    countShopSources,
    filterShopPets,
    getShopSource,
    getShopSourceName,
    SHOP_SOURCE_IDS,
} from "./shopFilters"

const atlas = makeAtlas([
    { source: "other" },
    { monsters: [makeMonster(spawnsAt(0, 0, 3), { map: "altgard" })] },
    {
        monsters: [
            makeMonster(spawnsAt(0, 0, 3), { map: "altgard" }),
            makeMonster(spawnsAt(0, 0, 3), { map: "verteron" }),
        ],
    },
    { monsters: [makeMonster([], { map: "verteron" })] },
])
const [notWild, oneMap, several, emptyMonster] = atlas.pets

const items = atlas.pets.map((pet) => {
    return { pet: pet } as ShopPet
})

describe("getShopSource", () => {
    it("sorts each pet into one source", () => {
        expect(getShopSource(atlas, notWild)).toBe("notWild")
        expect(getShopSource(atlas, oneMap)).toBe("altgard")
        expect(getShopSource(atlas, several)).toBe("several")
    })

    it("doesn't count a monster with no spawns", () => {
        expect(getShopSource(atlas, emptyMonster)).toBe("notWild")
    })
})

describe("getShopSourceName", () => {
    it("names each kind", () => {
        expect(getShopSourceName("notWild")).toBe("Not in the wild")
        expect(getShopSourceName("several")).toBe("Several maps")
        expect(getShopSourceName("reshanta")).toBe("Only Lower Reshanta")
    })

    it("names every source", () => {
        for (const source of SHOP_SOURCE_IDS) {
            expect(getShopSourceName(source)).toBeTruthy()
        }
    })
})

describe("countShopSources", () => {
    it("counts each pet once", () => {
        expect(countShopSources(atlas, items)).toEqual({
            notWild: 2,
            verteron: 0,
            reshanta: 0,
            altgard: 1,
            several: 1,
        })
    })
})

describe("filterShopPets", () => {
    it("keeps everything with nothing picked", () => {
        expect(filterShopPets(atlas, items, [])).toBe(items)
    })

    it("keeps pets from any picked source", () => {
        const kept = filterShopPets(atlas, items, ["altgard", "several"])

        expect(kept.map((item) => item.pet)).toEqual([oneMap, several])
    })
})
