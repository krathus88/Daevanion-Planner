import type { PetCategoryId } from "@pets/config/petCategories"
import type { PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas } from "@pets/data/petAtlas"
import { getPetLevel, MAX_PET_LEVEL } from "./petLevels"

export type FarmSpotPet = {
    pet: Pet
    spawns: number
}

export type FarmSpot = {
    name: string
    // Big area the spot lies in.
    area: string | null
    // Most spawns first.
    pets: FarmSpotPet[]
    spawns: number
    minLevel: number
    maxLevel: number
}

const SPAWN_STRIDE = 3

// Pets below Insight Lv3: their souls still count, whether locked or not.
export const isPetNeeded = (pet: Pet, levels: Record<string, number>) => {
    return getPetLevel(levels, pet.id) < MAX_PET_LEVEL
}

// Spots of one map ranked by how many pets below Lv3 spawn there, then by
// how many spawns those pets have in it.
export const getFarmSpots = (
    atlas: PetAtlas,
    pets: Pet[],
    levels: Record<string, number>,
    mapId: PetMapId,
) => {
    const mapSpots = atlas.spots[mapId]
    const spots = new Map<number, FarmSpot>()

    for (const pet of pets) {
        if (!isPetNeeded(pet, levels)) {
            continue
        }

        const spawnsBySpot = new Map<number, number>()

        for (const index of pet.monsters) {
            const monster = atlas.monsters[index]

            if (monster.map !== mapId) {
                continue
            }

            for (let i = 2; i < monster.spawns.length; i += SPAWN_STRIDE) {
                const spotIndex = monster.spawns[i]

                if (spotIndex < 0) {
                    continue
                }

                spawnsBySpot.set(
                    spotIndex,
                    (spawnsBySpot.get(spotIndex) ?? 0) + 1,
                )

                let spot = spots.get(spotIndex)

                if (!spot) {
                    spot = {
                        name: mapSpots[spotIndex].name,
                        area:
                            atlas.areas[mapId][mapSpots[spotIndex].area] ??
                            null,
                        pets: [],
                        spawns: 0,
                        minLevel: monster.level,
                        maxLevel: monster.level,
                    }
                    spots.set(spotIndex, spot)
                }

                spot.spawns++
                spot.minLevel = Math.min(spot.minLevel, monster.level)
                spot.maxLevel = Math.max(spot.maxLevel, monster.level)
            }
        }

        for (const [spotIndex, spawns] of spawnsBySpot) {
            spots.get(spotIndex)?.pets.push({ pet: pet, spawns: spawns })
        }
    }

    const ranked = [...spots.values()]

    for (const spot of ranked) {
        spot.pets.sort((a, b) => b.spawns - a.spawns)
    }

    return ranked.sort((a, b) => {
        return b.pets.length - a.pets.length || b.spawns - a.spawns
    })
}

// Spots that still have a pet of every required category, ranked as before.
// Their pets of those categories come first, so they show before "+N more".
export const filterFarmSpots = (
    spots: FarmSpot[],
    categories: PetCategoryId[],
) => {
    if (categories.length === 0) {
        return spots
    }

    const filtered: FarmSpot[] = []

    for (const spot of spots) {
        const hasAll = categories.every((category) => {
            return spot.pets.some((entry) => entry.pet.category === category)
        })

        if (!hasAll) {
            continue
        }

        const required = spot.pets.filter((entry) => {
            return categories.includes(entry.pet.category)
        })
        const others = spot.pets.filter((entry) => {
            return !categories.includes(entry.pet.category)
        })

        filtered.push({ ...spot, pets: [...required, ...others] })
    }

    return filtered
}
