import { beforeAll, describe, expect, it } from "vitest"
import type { PetAtlas } from "@pets/data/petAtlas"
import { detectCards } from "@pets/logic/cardDetection"
import { SHOP_LAYOUT, type PetPrint } from "@pets/logic/cardMatching"
import { detectShopCards } from "@pets/logic/shopCardDetection"
import { summarizeShop, type ShopReading } from "@pets/logic/shopCheck"
import {
    buildPrints,
    loadScreenshot,
    readAtlas,
    readShopScreenshot,
} from "@test/readPetScreenshot"

// src/test/screenshots/shop.jpg: 7 other items, two pets on sale (Intermediate
// Wind and Fire Spirit) and a sold-out one (Dratona Tinkerer), in rows of 6 and 4.
// One of the items (Fate Daeva) is sold out too.
let atlas: PetAtlas
let prints: PetPrint[]
let readings: ShopReading[]

const nameOf = (reading: ShopReading) => {
    return atlas.pets.find((pet) => pet.id === reading.petId)?.name
}

const idOf = (name: string) => {
    return atlas.pets.find((pet) => pet.name === name)?.id as number
}

beforeAll(async () => {
    atlas = readAtlas()
    prints = await buildPrints(atlas, SHOP_LAYOUT)
    readings = await readShopScreenshot("shop.jpg", prints)
}, 120_000)

describe("telling the Pets grid and the Shop apart", () => {
    it.each(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"])(
        "finds no shop cards in Pets grid screenshot %s",
        async (name) => {
            const pixels = await loadScreenshot(`${name}.jpg`)

            expect(detectShopCards(pixels)).toEqual([])
        },
    )

    it("finds no Pets grid cards in the Shop screenshot", async () => {
        const pixels = await loadScreenshot("shop.jpg")

        expect(detectCards(pixels)).toEqual([])
    })
})

describe("a real Shop screenshot", () => {
    it("finds every card, row by row", () => {
        expect(readings).toHaveLength(10)
    })

    it("recognizes the pets on sale", () => {
        expect(nameOf(readings[7])).toBe("Intermediate Wind Spirit")
        expect(nameOf(readings[8])).toBe("Intermediate Fire Spirit")
    })

    it("still names a sold-out pet under its banner", () => {
        expect(nameOf(readings[9])).toBe("Dratona Tinkerer")
    })

    it("lists pets below Lv3 and leaves other items out", () => {
        const summary = summarizeShop(readings, atlas.pets, {}, {}, {})

        expect(summary.needed.map((item) => item.pet.name)).toEqual([
            "Intermediate Wind Spirit",
            "Intermediate Fire Spirit",
        ])
        expect(summary.maxed).toEqual([])
    })

    it("moves a pet already at Lv3 to the other list", () => {
        const summary = summarizeShop(
            readings,
            atlas.pets,
            { [idOf("Intermediate Fire Spirit")]: 3 },
            {},
            {},
        )

        expect(summary.needed.map((item) => item.pet.name)).toEqual([
            "Intermediate Wind Spirit",
        ])
        expect(summary.maxed.map((item) => item.pet.name)).toEqual([
            "Intermediate Fire Spirit",
        ])
    })

    it("lists a sold-out pet as bought, and a sold-out item not at all", () => {
        const summary = summarizeShop(readings, atlas.pets, {}, {}, {})

        expect(summary.soldOut.map((item) => item.pet.name)).toEqual([
            "Dratona Tinkerer",
        ])
        expect(summary.unknown).toBe(7)
    })

    it("sees the Sold Out banners and nothing else", () => {
        expect(readings.map((reading) => reading.soldOut)).toEqual([
            false,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            false,
            true,
        ])
    })
})
