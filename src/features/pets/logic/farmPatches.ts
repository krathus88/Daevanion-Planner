import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas, PetMonster } from "@pets/data/petAtlas"
import { clusterSpawns, type SpotSpawn } from "./spotClusters"

// One spawn of a pet: where it is, its monster, its index in the monster's
// spawns, and the map spot it lies in.
type PatchSpawn = {
    x: number
    y: number
    monster: PetMonster
    index: number
    spot: number
}

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

// Pins within size / PATCH_GAP of each other count as the same ground: the
// distance spots link pins at.
const PATCH_GAP = 136
// A Best spot stays as narrow as a map spot.
const PATCH_WIDTH = 20
// Two spots merge when this share of the smaller one's pins lies on the
// other's ground. Patch pairs below PATCH_PAIR_SHARE are never tried.
const PATCH_SHARE = 0.5
const PATCH_PAIR_SHARE = 0.2

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
                x: monster.spawns[i],
                y: monster.spawns[i + 1],
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

// Share of the smaller list's pins that have a pin of the other within
// `gap`: near 1 when two pets spawn on the same ground, near 0 when they
// only touch at an edge.
const getNearShare = (a: PatchSpawn[], b: PatchSpawn[], gap: number) => {
    const [small, large] = a.length <= b.length ? [a, b] : [b, a]
    const cells = new Map<string, PatchSpawn[]>()
    const getCell = (x: number, y: number) => {
        return `${Math.floor(x / gap)},${Math.floor(y / gap)}`
    }

    for (const spawn of large) {
        const cell = getCell(spawn.x, spawn.y)

        cells.set(cell, [...(cells.get(cell) ?? []), spawn])
    }

    let near = 0

    for (const spawn of small) {
        const found = [-gap, 0, gap].some((dx) => {
            return [-gap, 0, gap].some((dy) => {
                return (
                    cells.get(getCell(spawn.x + dx, spawn.y + dy)) ?? []
                ).some((other) => {
                    return (
                        Math.hypot(spawn.x - other.x, spawn.y - other.y) <= gap
                    )
                })
            })
        })

        if (found) {
            near++
        }
    }

    return near / small.length
}

// Whether two patches' boxes, grown by `gap`, touch.
const isTouching = (a: PetPatch, b: PetPatch, gap: number) => {
    return (
        a.left - gap <= b.right + gap &&
        b.left - gap <= a.right + gap &&
        a.top - gap <= b.bottom + gap &&
        b.top - gap <= a.bottom + gap
    )
}

const getWidth = (spawns: PatchSpawn[]) => {
    const xs = spawns.map((spawn) => spawn.x)
    const ys = spawns.map((spawn) => spawn.y)

    return Math.max(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
    )
}

// Groups patches of different pets that spawn on the same ground into one
// Best spot, the pairs sharing the most first. A merge needs the two whole
// spots to share ground, not just one pair, so a pet that spreads between
// two places doesn't chain them together; spots also stay narrow. Each pet's
// patch stays whole, so a pet never shows up split over two spots next to
// each other.
export const mergePatches = (patches: PetPatch[], mapId: PetMapId) => {
    const size = PET_MAPS[mapId].size
    const gap = size / PATCH_GAP
    const pairs: { a: number; b: number; share: number }[] = []

    for (let a = 0; a < patches.length; a++) {
        for (let b = a + 1; b < patches.length; b++) {
            if (!isTouching(patches[a], patches[b], gap)) {
                continue
            }

            const share = getNearShare(
                patches[a].spawns,
                patches[b].spawns,
                gap,
            )

            if (share >= PATCH_PAIR_SHARE) {
                pairs.push({ a: a, b: b, share: share })
            }
        }
    }

    pairs.sort((first, second) => second.share - first.share)

    const groups = patches.map((patch) => [patch])
    const groupOf = patches.map((_, index) => index)

    for (const pair of pairs) {
        const first = groupOf[pair.a]
        const second = groupOf[pair.b]

        if (first === second) {
            continue
        }

        const firstSpawns = groups[first].flatMap((patch) => patch.spawns)
        const secondSpawns = groups[second].flatMap((patch) => patch.spawns)
        const fits =
            getWidth([...firstSpawns, ...secondSpawns]) <= size / PATCH_WIDTH &&
            getNearShare(firstSpawns, secondSpawns, gap) >= PATCH_SHARE

        if (!fits) {
            continue
        }

        groups[first] = [...groups[first], ...groups[second]]
        groups[second] = []

        for (const [index, group] of groupOf.entries()) {
            if (group === second) {
                groupOf[index] = first
            }
        }
    }

    return groups.filter((group) => group.length > 0)
}
