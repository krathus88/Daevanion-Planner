import { PET_BOSSES } from "@pets/config/petBosses"
import { PET_MAP_IDS, PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet, PetSource } from "@pets/data/petAtlas"

const NO_SPAWN_TEXT: Record<Exclude<PetSource, "field">, string> = {
    other: "No open-world spawn: shop, quest, chest or dungeon",
    special: "Special pet: no open-world spawn",
}

// "Fire Temple boss" for a pet whose soul drops from a dungeon boss.
export const getBossText = (pet: Pet) => {
    const boss = PET_BOSSES[pet.id]

    if (!boss) {
        return null
    }

    return boss.confirmed
        ? `${boss.dungeon} boss`
        : `${boss.dungeon} boss (unconfirmed)`
}

// "Fire Temple boss", or why a pet has no open-world spawn.
export const getNoSpawnText = (pet: Pet) => {
    const bossText = getBossText(pet)

    if (bossText) {
        return bossText
    }

    return pet.source === "field"
        ? "No tracked spawns"
        : NO_SPAWN_TEXT[pet.source]
}

// "Verteron 377 · Altgard 69" (plus "· Fire Temple boss" for a field pet
// that is also a dungeon boss), or why there is no spawn.
export const describePetSpawns = (
    pet: Pet,
    counts: Partial<Record<PetMapId, number>>,
) => {
    if (pet.source !== "field") {
        return getNoSpawnText(pet)
    }

    const bossText = getBossText(pet)
    const parts: string[] = []

    for (const mapId of PET_MAP_IDS) {
        const count = counts[mapId]

        if (count) {
            parts.push(`${PET_MAPS[mapId].name} ${count}`)
        }
    }

    if (bossText) {
        parts.push(bossText)
    }

    return parts.length > 0 ? parts.join(" · ") : "No tracked spawns"
}
