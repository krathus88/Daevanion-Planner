import { beforeAll, describe, expect, it } from "vitest"
import type { PetAtlas } from "@pets/data/petAtlas"
import type { PetPrint } from "@pets/logic/cardMatching"
import {
    buildPrints,
    readAtlas,
    readPetScreenshot,
} from "@test/readPetScreenshot"

// Real game screenshots in src/test/screenshots. Counters were checked by eye
// against the images. Pet names are what the importer reads; they guard against
// changes, and aren't all confirmed by someone who knows the pets.
const SHOT_1 = [
    ["56/75", "Red Spark Ignus"],
    ["MAX", "Krall Laborer"],
    ["MAX", "Klaw"],
    ["MAX", "Manduri Fighter"],
    ["MAX", "Krall Warshaman"],
    ["MAX", "Varg Berserker"],
    ["MAX", "Krall Warrior"],
    ["MAX", "Klaw Scout"],
    ["MAX", "Elite Manduri Fighter"],
    ["MAX", "Aullaeu Shaman"],
    ["MAX", "Mumu Warrior"],
    ["MAX", "Biruta"],
]

const SHOT_4 = [
    ["MAX", "Drana Mutant Brute"],
    ["MAX", "Drana Predator"],
    ["MAX", "Guardite"],
    ["MAX", "Watcher Guardite"],
    ["MAX", "Dark Spirit"],
    ["MAX", "Pagati"],
    ["MAX", "Swift Lugi"],
    ["58/75", "Swarm"],
    ["31/75", "Spider"],
    ["28/75", "Black Smoke Murute"],
    ["28/75", "Silver Blade Rotan"],
    ["25/75", "Elite Poisonous Spore Fungen"],
    ["25/75", "Duduka Worker"],
    ["19/75", "Nagarant Guardian Warrior"],
    ["13/75", "Distorted Mutant"],
]

const SHOT_5 = [
    ["10/75", "Mumu Overseer"],
    ["10/75", "Dratona Tinkerer"],
    ["10/75", "Ashen Lupyllini"],
    ["10/75", "Ultimate Wind Spirit"],
    ["10/75", "Elite Soulless Corpse Gnat"],
    ["8/75", "Armadon"],
    ["5/75", "Urugugu Brawler"],
    ["5/75", "Pretor Veil Administrator"],
    ["5/75", "Tog"],
    ["5/75", "Young Tog"],
    ["5/75", "Tamed Karnif"],
    ["5/75", "Ultimate Fire Spirit"],
    ["5/75", "Vigilant Oculazen"],
    ["5/75", "Krao Seal Guardian"],
    ["0/75", "Sentinel K'nash"],
]

const SHOT_6 = [
    ["0/75", "Coradon"],
    ["0/75", "Mutated Insectoid Valka"],
    ["0/75", "Ashen Basilisk"],
    ["0/75", "Odyle Stone Spirit"],
    ["0/75", "Ancient Spirit"],
    ["0/75", "Cadaver Cleaner"],
    ["0/75", "Mudthorn"],
    ["0/75", "Poison Blood"],
    ["0/75", "Congealed Drana"],
    ["24/25", "Harcon"],
    ["23/25", "Phantasmal Lakshmi"],
    ["22/25", "Spirit King's Bodyguard Warrior"],
    ["21/25", "Elite Guardite"],
    ["20/25", "Elite Ursus"],
    ["20/25", "Elite Karnif"],
]

const SHOT_7 = [
    ["20/25", "Mutated Ursus"],
    ["20/25", "Ultimate Water Spirit"],
    ["20/25", "Dried Up Forest Guardian"],
    ["20/25", "Ashen Agrint"],
    ["20/25", "Krao Test Subject"],
    ["20/25", "Parasite Swarm"],
    ["20/25", "Flame Stone Guardian Statue"],
    ["20/25", "Soulless Corpse Gnat"],
    ["16/25", "Elite Klaw"],
    ["16/25", "Naga Elite Priest"],
    ["16/25", "Mutated Forest Guardian"],
    ["15/25", "Elite Keneire"],
    ["15/25", "Eternal Coradon"],
    ["15/25", "Dionae"],
    ["15/25", "Ultimate Earth Spirit"],
]

const SHOT_8 = [
    ["15/25", "Krao Mutant"],
    ["15/25", "Drakana Kalgolem"],
    ["15/25", "Faded Predator"],
    ["14/25", "Withered Branch Spider"],
    ["13/25", "Predator Saraswati"],
    ["10/25", "Furious Feruk"],
    ["10/25", "Elite Dratona"],
    ["10/25", "Aberrant Odyle Spider"],
    ["10/25", "Grave Rat"],
    ["10/25", "Cadaver Insectoid"],
    ["10/25", "Flame Barghest"],
    ["10/25", "Forest Dionae"],
    ["10/25", "Ashen Dionae"],
    ["10/25", "Swamp Monster"],
    ["10/25", "Faded Mutant Brute"],
]

const SHOT_9 = [
    ["10/25", "Duduka Trebuchet Worker"],
    ["10/25", "Drana Mutant"],
    ["10/25", "Faded Mutant"],
    ["5/25", "Aultross's Doppelganger"],
    ["5/25", "Kernon"],
    ["5/25", "Basilisk"],
    ["5/25", "Slime"],
    ["5/25", "Drana Slime"],
    ["5/25", "Gatekeeper Pinopi"],
    ["5/25", "Drana Contaminant"],
    ["5/25", "Faded Floater"],
    ["0/25", "Venomous Insect Sram"],
    ["0/25", "Faded Drana"],
    ["0/5", "Black Dragon"],
    ["0/5", "Wandering Merchant Lugi"],
]

let atlas: PetAtlas
let prints: PetPrint[]

beforeAll(async () => {
    atlas = readAtlas()
    prints = await buildPrints(atlas)
}, 120_000)

const read = async (name: string) => {
    const cards = await readPetScreenshot(name, atlas, prints)

    return cards.map((card) => {
        return { counter: card.counter, pet: card.pet }
    })
}

const toCards = (rows: string[][]) => {
    return rows.map(([counter, pet]) => {
        return { counter: counter, pet: pet }
    })
}

const SHORT_CROP = [
    ["MAX", "Krall Laborer"],
    ["MAX", "Klaw"],
    ["MAX", "Manduri Fighter"],
    ["MAX", "Krall Warshaman"],
    ["MAX", "Varg Berserker"],
]

describe("real Pets screenshots", () => {
    it.each([
        ["1.jpg, the second card selected", "1.jpg", SHOT_1],
        ["4.jpg", "4.jpg", SHOT_4],
        ["5.jpg", "5.jpg", SHOT_5],
        ["6.jpg", "6.jpg", SHOT_6],
        ["7.jpg", "7.jpg", SHOT_7],
        ["8.jpg", "8.jpg", SHOT_8],
        ["9.jpg", "9.jpg", SHOT_9],
    ])("reads every card of %s", async (_label, name, rows) => {
        expect(await read(name)).toEqual(toCards(rows))
    })

    it("reads locked cards' soul bars", async () => {
        // Names aren't checked: 10.jpg is an older shot of pets that moved on,
        // and grey art is the hardest to tell apart.
        const cards = await read("10.jpg")

        expect(cards.map((card) => card.counter)).toEqual([
            "0/25",
            "0/25",
            "0/25",
            "0/25",
            "0/25",
            "0/25",
            "0/25",
            "3/5",
            "3/5",
            "2/5",
            "1/5",
            "1/5",
            "1/5",
            "0/5",
            "0/5",
        ])
    })

    it("skips cards the screenshot's edge cuts off", async () => {
        // 9.jpg has a cut-off row at the top and another at the bottom.
        expect(await read("9.jpg")).toHaveLength(15)
    })

    it.each([
        ["the first card selected", "2.jpg"],
        ["the third card selected", "3.jpg"],
    ])("reads a two-row crop with %s", async (_label, name) => {
        expect(await read(name)).toEqual(
            toCards([["56/75", "Red Spark Ignus"], ...SHORT_CROP]),
        )
    })

    it("flags a tens digit it can barely make out", async () => {
        const cards = await readPetScreenshot("5.jpg", atlas, prints)

        expect(cards[1]).toMatchObject({ counter: "10/75", unsure: true })
        expect(cards[0]).toMatchObject({ counter: "10/75", unsure: false })
    })

    it("never reads one pet twice in a screenshot", async () => {
        for (const name of ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "6.jpg"]) {
            const pets = (await read(name)).map((card) => card.pet)

            expect(new Set(pets).size, name).toBe(pets.length)
        }
    })
})
