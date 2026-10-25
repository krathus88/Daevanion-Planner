import { PET_MAP_IDS, PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { PetSource } from "@pets/data/petAtlas"

export const NO_SPAWN_TEXT: Record<Exclude<PetSource, "field">, string> = {
    other: "No open-world spawn: shop, quest, chest or dungeon",
    special: "Special pet: no open-world spawn",
}

// "Verteron 377 · Altgard 69", or why there is no spawn.
export const describePetSpawns = (
    source: PetSource,
    counts: Partial<Record<PetMapId, number>>,
) => {
    if (source !== "field") {
        return NO_SPAWN_TEXT[source]
    }

    const parts: string[] = []

    for (const mapId of PET_MAP_IDS) {
        const count = counts[mapId]

        if (count) {
            parts.push(`${PET_MAPS[mapId].name} ${count}`)
        }
    }

    return parts.length > 0 ? parts.join(" · ") : "No tracked spawns"
}
