import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas, PetMonster } from "@pets/data/petAtlas"
import { clusterSpawns, type SpotSpawn } from "./spotClusters"

// One spawn of a pet: its monster, its index in the monster's spawns, and
// the map spot it lies in.
type PatchSpawn = { monster: PetMonster; index: number; spot: number }

// One pet's own cluster of pins and the box around them.
export type PetPatch = {
    pet: Pet
    spawns: PatchSpawn[]
    left: number
    top: number
    right: number
    bottom: number
}

const SPAWN_STRIDE = 3

// Patches this close count as touching: the distance spots link pins at.
const PATCH_GAP = 136
// A Best spot stays as narrow as a map spot.
const PATCH_WIDTH = 20

const buildPetPatches = (atlas: PetAtlas, pet: Pet, mapId: PetMapId) => {
    const spawns: SpotSpawn[] = []
    const owners: PatchSpawn[] = []

    for (const monsterIndex of pet.monsters) {
        const monster = atlas.monsters[monsterIndex]

        if (monster.map !== mapId) {
            continue
        }

        for (let i = 0; i < monster.spawns.length; i += SPAWN_STRIDE) {
            const spot = monster.spawns[i + 2]

            spawns.push({
                x: monster.spawns[i],
                y: monster.spawns[i + 1],
                area: atlas.spots[mapId][spot]?.area ?? -1,
                key: owners.length,
            })
            owners.push({
                monster: monster,
                index: i / SPAWN_STRIDE,
                spot: spot,
            })
        }
    }

    return clusterSpawns(spawns, PET_MAPS[mapId].size).map(
        (group): PetPatch => {
            const xs = group.map((spawn) => spawn.x)
            const ys = group.map((spawn) => spawn.y)

            return {
                pet: pet,
                spawns: group.map((spawn) => owners[spawn.key]),
                left: Math.min(...xs),
                top: Math.min(...ys),
                right: Math.max(...xs),
                bottom: Math.max(...ys),
            }
        },
    )
}

// The data never changes while the page is open, so each pet and map is
// grouped once.
const cache = new Map<string, PetPatch[]>()

export const getPetPatches = (atlas: PetAtlas, pet: Pet, mapId: PetMapId) => {
    const key = `${mapId}:${pet.id}`
    let patches = cache.get(key)

    if (!patches) {
        patches = buildPetPatches(atlas, pet, mapId)
        cache.set(key, patches)
    }

    return patches
}

const getWidth = (patches: PetPatch[]) => {
    return Math.max(
        Math.max(...patches.map((patch) => patch.right)) -
            Math.min(...patches.map((patch) => patch.left)),
        Math.max(...patches.map((patch) => patch.bottom)) -
            Math.min(...patches.map((patch) => patch.top)),
    )
}

// How much two patches' boxes (grown by `gap`) overlap, as a share of the
// smaller box; 0 when they don't touch.
const getOverlap = (a: PetPatch, b: PetPatch, gap: number) => {
    const width =
        Math.min(a.right, b.right) - Math.max(a.left, b.left) + 2 * gap
    const height =
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) + 2 * gap

    if (width <= 0 || height <= 0) {
        return 0
    }

    const getArea = (patch: PetPatch) => {
        return (
            (patch.right - patch.left + 2 * gap) *
            (patch.bottom - patch.top + 2 * gap)
        )
    }

    return (width * height) / Math.min(getArea(a), getArea(b))
}

// Groups patches of different pets that cover the same ground into one Best
// spot, the most overlapping first, while the spot stays narrow. Each pet's
// patch stays whole, so a pet never shows up split over two spots next to
// each other.
export const mergePatches = (patches: PetPatch[], mapId: PetMapId) => {
    const size = PET_MAPS[mapId].size
    const gap = size / PATCH_GAP
    const pairs: { a: number; b: number; overlap: number }[] = []

    for (let a = 0; a < patches.length; a++) {
        for (let b = a + 1; b < patches.length; b++) {
            const overlap = getOverlap(patches[a], patches[b], gap)

            if (overlap > 0) {
                pairs.push({ a: a, b: b, overlap: overlap })
            }
        }
    }

    pairs.sort((first, second) => second.overlap - first.overlap)

    const groups = patches.map((patch) => [patch])
    const groupOf = patches.map((_, index) => index)

    for (const pair of pairs) {
        const first = groupOf[pair.a]
        const second = groupOf[pair.b]

        if (first === second) {
            continue
        }

        const merged = [...groups[first], ...groups[second]]

        if (getWidth(merged) > size / PATCH_WIDTH) {
            continue
        }

        groups[first] = merged
        groups[second] = []

        for (const [index, group] of groupOf.entries()) {
            if (group === second) {
                groupOf[index] = first
            }
        }
    }

    return groups.filter((group) => group.length > 0)
}
