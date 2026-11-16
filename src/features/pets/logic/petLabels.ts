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

// "Field boss" for a pet whose soul monsters are all field bosses: a normal
// monster beside them would make it farmable without one.
export const getFieldBossText = (monsters: { fieldBoss?: boolean }[]) => {
    const onlyBosses =
        monsters.length > 0 && monsters.every((monster) => monster.fieldBoss)

    return onlyBosses ? "Field boss" : null
}

// "Verteron 377 · Altgard 69" (plus "· Fire Temple boss" for a field pet
// that is also a dungeon boss, "· Field boss" for one only field bosses
// drop), or why there is no spawn.
export const describePetSpawns = (
    pet: Pet,
    counts: Partial<Record<PetMapId, number>>,
    monsters: { fieldBoss?: boolean }[] = [],
) => {
    if (pet.source !== "field") {
        return getNoSpawnText(pet)
    }

    const bossText = getBossText(pet)
    const fieldBossText = getFieldBossText(monsters)
    const parts: string[] = []

    for (const mapId of PET_MAP_IDS) {
        const count = counts[mapId]

        if (count) {
            parts.push(`${PET_MAPS[mapId].name} ${count}`)
        }
    }

    if (parts.length > 0 && fieldBossText) {
        parts.push(fieldBossText)
    }

    if (bossText) {
        parts.push(bossText)
    }

    return parts.length > 0 ? parts.join(" · ") : "No tracked spawns"
}
