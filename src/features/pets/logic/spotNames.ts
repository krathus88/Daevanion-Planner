import type { PetMapId } from "@pets/config/petMaps"
import type { PetAtlas, PetMonster } from "@pets/data/petAtlas"

// Spot name per spawn of each monster, null for none.
export type SpotLabels = Map<PetMonster, (string | null)[]>

export const getSpotArea = (
    atlas: PetAtlas,
    mapId: PetMapId,
    spotIndex: number,
) => {
    const spot = atlas.spots[mapId][spotIndex]

    return spot ? (atlas.areas[mapId][spot.area] ?? null) : null
}

// "Destroyed Scriptorium (southeast)" -> "Destroyed Scriptorium".
const getSpotBase = (name: string) => {
    return name.replace(/ \([^)]*\)$/, "")
}

// Names a group of spawns (their map spot indexes) after the map spot most
// of them sit in; when all of them share a landmark, the "(southeast)" side
// is dropped. Names in `used` belong to earlier groups and get added to.
// Null when no spawn lies in a map spot.
export const nameSpotGroup = (
    atlas: PetAtlas,
    mapId: PetMapId,
    spotIndexes: number[],
    used: Set<string>,
) => {
    const mapSpots = atlas.spots[mapId]
    const counts = new Map<number, number>()

    for (const spot of spotIndexes) {
        if (spot >= 0) {
            counts.set(spot, (counts.get(spot) ?? 0) + 1)
        }
    }

    // Map spots this group covers, most of its spawns first.
    const ranked = [...counts].sort((a, b) => {
        return (
            b[1] - a[1] ||
            mapSpots[a[0]].name.localeCompare(mapSpots[b[0]].name)
        )
    })
    const main = ranked[0]

    if (!main) {
        return null
    }

    const mainName = mapSpots[main[0]].name
    const base = getSpotBase(mainName)
    const shared = ranked.every(([spot]) => {
        return getSpotBase(mapSpots[spot].name) === base
    })
    // Another group already took the main name: use the next spot's.
    const free = ranked
        .map(([spot]) => mapSpots[spot].name)
        .find((spotName) => !used.has(spotName))
    let name = shared && !used.has(base) ? base : (free ?? mainName)

    for (let number = 2; used.has(name); number++) {
        name = `${mainName} ${number}`
    }

    used.add(name)

    return { name: name, area: getSpotArea(atlas, mapId, main[0]) }
}
