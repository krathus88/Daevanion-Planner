import { PET_MAP_IDS, PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas } from "@pets/data/petAtlas"
import { getPetMapCounts } from "@pets/logic/petFinder"
import type { ShopPet } from "@pets/logic/shopCheck"

// Where else a pet on sale can be had: nowhere in the wild, only on one map,
// or on several. Each pet falls in exactly one.
export type ShopSourceId = "notWild" | PetMapId | "several"

export const SHOP_SOURCE_IDS: ShopSourceId[] = [
    "notWild",
    ...PET_MAP_IDS,
    "several",
]

export const getShopSourceName = (source: ShopSourceId) => {
    if (source === "notWild") {
        return "Not in the wild"
    }

    if (source === "several") {
        return "Several maps"
    }

    return `Only ${PET_MAPS[source].name}`
}

export const getShopSource = (atlas: PetAtlas, pet: Pet): ShopSourceId => {
    const counts = getPetMapCounts(atlas, pet)
    const maps: PetMapId[] = []

    for (const mapId of PET_MAP_IDS) {
        if ((counts[mapId] ?? 0) > 0) {
            maps.push(mapId)
        }
    }

    if (maps.length === 0) {
        return "notWild"
    }

    if (maps.length === 1) {
        return maps[0]
    }

    return "several"
}

// How many pets fall in each source.
export const countShopSources = (atlas: PetAtlas, items: ShopPet[]) => {
    const counts: Record<ShopSourceId, number> = {
        notWild: 0,
        verteron: 0,
        reshanta: 0,
        altgard: 0,
        several: 0,
    }

    for (const item of items) {
        counts[getShopSource(atlas, item.pet)]++
    }

    return counts
}

// Keeps pets from any picked source; none picked keeps them all.
export const filterShopPets = (
    atlas: PetAtlas,
    items: ShopPet[],
    sources: ShopSourceId[],
) => {
    if (sources.length === 0) {
        return items
    }

    const kept: ShopPet[] = []

    for (const item of items) {
        if (sources.includes(getShopSource(atlas, item.pet))) {
            kept.push(item)
        }
    }

    return kept
}
