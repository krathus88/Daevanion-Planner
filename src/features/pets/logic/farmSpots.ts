import type { PetCategoryId } from "@pets/config/petCategories"
import type { PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas } from "@pets/data/petAtlas"
import { getPetPatches, mergePatches } from "./farmPatches"
import { getPetLevel, MAX_PET_LEVEL } from "./petLevels"
import { nameSpotGroup, type SpotLabels } from "./spotNames"

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

// Pets below Insight Lv3: their souls still count, whether locked or not.
export const isPetNeeded = (pet: Pet, levels: Record<string, number>) => {
    return getPetLevel(levels, pet.id) < MAX_PET_LEVEL
}

// Spots of one map where pets below Lv3 spawn, made from each pet's own
// patches (`mergePatches`), ranked by how many of those pets spawn there,
// then by how many spawns they have in it. Labels name each spawn's spot
// for the map pins.
export const getFarmSpots = (
    atlas: PetAtlas,
    pets: Pet[],
    levels: Record<string, number>,
    mapId: PetMapId,
) => {
    const patches = pets
        .filter((pet) => isPetNeeded(pet, levels))
        .flatMap((pet) => getPetPatches(atlas, pet, mapId))
    const ranked = mergePatches(patches, mapId).map((group) => {
        const spawnsByPet = new Map<Pet, number>()
        const levelsSeen: number[] = []

        for (const patch of group) {
            spawnsByPet.set(
                patch.pet,
                (spawnsByPet.get(patch.pet) ?? 0) + patch.spawns.length,
            )

            for (const spawn of patch.spawns) {
                levelsSeen.push(spawn.monster.level)
            }
        }

        const spotPets = [...spawnsByPet].map(([pet, spawns]) => {
            return { pet: pet, spawns: spawns }
        })

        return {
            group: group,
            pets: spotPets.sort((a, b) => b.spawns - a.spawns),
            spawns: levelsSeen.length,
            minLevel: Math.min(...levelsSeen),
            maxLevel: Math.max(...levelsSeen),
        }
    })

    ranked.sort((a, b) => {
        return b.pets.length - a.pets.length || b.spawns - a.spawns
    })

    const spots: FarmSpot[] = []
    const labels: SpotLabels = new Map()
    const used = new Set<string>()

    // Named in rank order, so the best spots get the plain names.
    for (const entry of ranked) {
        const named = nameSpotGroup(
            atlas,
            mapId,
            entry.group.flatMap((patch) => {
                return patch.spawns.map((spawn) => spawn.spot)
            }),
            used,
        )

        if (!named) {
            continue
        }

        spots.push({
            name: named.name,
            area: named.area,
            pets: entry.pets,
            spawns: entry.spawns,
            minLevel: entry.minLevel,
            maxLevel: entry.maxLevel,
        })

        for (const patch of entry.group) {
            for (const spawn of patch.spawns) {
                const monsterLabels = labels.get(spawn.monster) ?? []

                monsterLabels[spawn.index] = named.name
                labels.set(spawn.monster, monsterLabels)
            }
        }
    }

    return { spots: spots, labels: labels }
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
