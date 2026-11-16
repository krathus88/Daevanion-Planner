import { PET_BOSSES } from "@pets/config/petBosses"
import { PET_MAP_IDS, PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas } from "@pets/data/petAtlas"
import { getPetMapCounts, getPetMonsters } from "@pets/logic/petFinder"
import { getFieldBossText } from "@pets/logic/petLabels"
import type { ShopPet } from "@pets/logic/shopCheck"

// Where a pet on sale can be had, like the companion's shop panel tags it
// (its shop.Tags): each map its soul monsters spawn on (or nowhere in the
// wild), a dungeon boss dropping its soul, and only field bosses dropping it.
// A pet can have several.
export type ShopSourceId = PetMapId | "notWild" | "dungeon" | "fieldBoss"

export const SHOP_SOURCE_IDS: ShopSourceId[] = [
    ...PET_MAP_IDS,
    "notWild",
    "dungeon",
    "fieldBoss",
]

export const getShopSourceName = (source: ShopSourceId) => {
    switch (source) {
        case "notWild":
            return "Not in the wild"
        case "dungeon":
            return "Dungeon"
        case "fieldBoss":
            return "Field boss"
        default:
            return PET_MAPS[source].name
    }
}

// A pet's sources, in SHOP_SOURCE_IDS order.
export const getShopSources = (atlas: PetAtlas, pet: Pet) => {
    const counts = getPetMapCounts(atlas, pet)
    const sources: ShopSourceId[] = PET_MAP_IDS.filter((mapId) => {
        return (counts[mapId] ?? 0) > 0
    })

    if (sources.length === 0) {
        sources.push("notWild")
    }

    if (PET_BOSSES[pet.id]) {
        sources.push("dungeon")
    }

    if (getFieldBossText(getPetMonsters(atlas, pet))) {
        sources.push("fieldBoss")
    }

    return sources
}

// How many pets have each source (a pet counts under each of its own).
export const countShopSources = (atlas: PetAtlas, items: ShopPet[]) => {
    const counts = Object.fromEntries(
        SHOP_SOURCE_IDS.map((source) => [source, 0]),
    ) as Record<ShopSourceId, number>

    for (const item of items) {
        for (const source of getShopSources(atlas, item.pet)) {
            counts[source]++
        }
    }

    return counts
}

// Keeps pets with any picked source; none picked keeps them all.
export const filterShopPets = (
    atlas: PetAtlas,
    items: ShopPet[],
    sources: ShopSourceId[],
) => {
    if (sources.length === 0) {
        return items
    }

    return items.filter((item) => {
        return getShopSources(atlas, item.pet).some((source) => {
            return sources.includes(source)
        })
    })
}
