import type { PetCategoryId } from "@pets/config/petCategories"
import type { PetMapId } from "@pets/config/petMaps"
// Fetched as a file so the data downloads only on the Pets page.
import atlasUrl from "./petAtlas.json?url"

// field: open-world soul monsters; other: shop, quest, chest or dungeon;
// special: event and premium pets.
export type PetSource = "field" | "other" | "special"

export type Pet = {
    id: number
    name: string
    category: PetCategoryId
    source: PetSource
    // Portrait in @assets/pets; missing when no source had one.
    icon?: string
    // Indexes into PetAtlas.monsters.
    monsters: number[]
}

export type PetMonster = {
    name: string
    level: number
    rank: "normal" | "elite" | "hero"
    map: PetMapId
    // Flat x, y, spot triples; spot indexes PetAtlas.spots[map], -1 is none.
    spawns: number[]
}

// A tight group of spawns, named after its closest landmark.
type PetSpot = {
    name: string
    // Indexes PetAtlas.areas[map], -1 is none.
    area: number
}

export type PetAtlas = {
    patch: number
    client: string
    // Big named areas from the map's outlines.
    areas: Record<PetMapId, string[]>
    spots: Record<PetMapId, PetSpot[]>
    pets: Pet[]
    monsters: PetMonster[]
}

let pending: Promise<PetAtlas> | null = null

const fetchPetAtlas = async (): Promise<PetAtlas> => {
    const response = await fetch(atlasUrl)

    if (!response.ok) {
        throw new Error(`Pet data failed to load (${response.status}).`)
    }

    return response.json()
}

export const loadPetAtlas = () => {
    if (!pending) {
        pending = fetchPetAtlas().catch((error: unknown) => {
            // Let the next visit try again.
            pending = null
            throw error
        })
    }

    return pending
}
