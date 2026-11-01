import type { PetCategoryId } from "@pets/config/petCategories"
import type { PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas, PetMonster } from "@pets/data/petAtlas"

// Patches are cached by pet id for the page's whole life, so every test pet
// gets its own.
let nextPetId = 1

// `count` spawns 10 px apart in a square around (x, y), as flat x, y, spot
// triples like the atlas stores them.
export const spawnsAt = (x: number, y: number, count: number, spot = -1) => {
    const side = Math.ceil(Math.sqrt(count))
    const spawns: number[] = []

    for (let index = 0; index < count; index++) {
        spawns.push(
            x + (index % side) * 10,
            y + Math.floor(index / side) * 10,
            spot,
        )
    }

    return spawns
}

export const makeMonster = (
    spawns: number[],
    overrides: Partial<PetMonster> = {},
): PetMonster => {
    return {
        name: "Monster",
        level: 10,
        rank: "normal",
        map: "verteron",
        spawns: spawns,
        ...overrides,
    }
}

type AtlasPet = {
    name?: string
    category?: PetCategoryId
    source?: Pet["source"]
    monsters?: PetMonster[]
}

// An atlas with each pet feeding from its own monsters.
export const makeAtlas = (
    petList: AtlasPet[],
    overrides: Partial<PetAtlas> = {},
): PetAtlas => {
    const monsters: PetMonster[] = []
    const pets = petList.map((entry) => {
        const id = nextPetId++
        const first = monsters.length

        monsters.push(...(entry.monsters ?? []))

        return {
            id: id,
            name: entry.name ?? `Pet ${id}`,
            category: entry.category ?? ("" as PetCategoryId),
            source: entry.source ?? "field",
            monsters: (entry.monsters ?? []).map((_, index) => first + index),
        }
    })

    return {
        patch: 1,
        client: "test",
        areas: { verteron: [], reshanta: [], altgard: [] },
        spots: { verteron: [], reshanta: [], altgard: [] },
        pets: pets,
        monsters: monsters,
        ...overrides,
    }
}

export const namedSpots = (mapId: PetMapId, names: string[], area = -1) => {
    return {
        verteron: [],
        reshanta: [],
        altgard: [],
        [mapId]: names.map((name) => {
            return { name: name, area: area }
        }),
    }
}
