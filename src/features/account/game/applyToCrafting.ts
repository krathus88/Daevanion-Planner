import { BOUND_MATERIALS } from "@crafting/config/boundMaterials"
import type { CraftingSettings } from "@crafting/types"
import {
    BAG_STORAGE,
    CHARACTER_STORAGE,
    GAME_PROFESSIONS,
    getServerId,
    SHARED_STORAGE,
} from "./gameIds"
import type { GameSnapshot } from "./gameSnapshot"

// A character's own storages: anything there can reach any character
// through Server Storage, unless it's soulbound or a bound material.
const OWN_STORAGES = [BAG_STORAGE, CHARACTER_STORAGE]

// A bound material counts as its tradable twin, and only when `chosen`
// (the chosen character's own): it never leaves its character.
const addCounts = (
    owned: Record<string, number>,
    counts: Record<string, number> | undefined,
    chosen: boolean,
) => {
    for (const [id, count] of Object.entries(counts ?? {})) {
        const tradable = BOUND_MATERIALS[id]

        if (count > 0 && (tradable === undefined || chosen)) {
            const key = tradable ?? id

            owned[key] = (owned[key] ?? 0) + count
        }
    }
}

// What the crafting calculator counts as owned on a server: every
// character's Bag and Character Storage (what isn't soulbound or a bound
// material), Server Storage once, and the chosen character's soulbound items
// and bound materials. Null before the companion sent any inventory.
export const getOwnedItems = (
    snapshots: GameSnapshot[],
    server: string,
    character: string | null,
) => {
    const owned: Record<string, number> = {}
    let shared: GameSnapshot | null = null

    for (const snapshot of snapshots) {
        if (
            snapshot.items === undefined ||
            getServerId(snapshot.character.server) !== server
        ) {
            continue
        }

        const chosen = snapshot.character.name === character

        for (const storage of OWN_STORAGES) {
            addCounts(owned, snapshot.items[storage], chosen)
        }

        if (chosen) {
            for (const storage of OWN_STORAGES) {
                addCounts(owned, snapshot.bound?.[storage], true)
            }
        }

        // Server Storage is the same on every character: take the newest.
        if (
            shared === null ||
            (snapshot.itemsAt ?? 0) > (shared.itemsAt ?? 0)
        ) {
            shared = snapshot
        }
    }

    if (shared === null) {
        return null
    }

    addCounts(owned, shared.items?.[SHARED_STORAGE], true)

    return owned
}

// The chosen character's crafting levels (proficiency is per character in
// the game), over the ones typed in. Null when the companion hasn't sent them.
export const getProficiency = (
    snapshots: GameSnapshot[],
    server: string,
    character: string | null,
) => {
    const snapshot = snapshots.find((item) => {
        return (
            item.character.name === character &&
            getServerId(item.character.server) === server &&
            item.professions !== undefined
        )
    })

    if (snapshot?.professions === undefined) {
        return null
    }

    const proficiency: CraftingSettings["proficiency"] = {}

    for (const [number, level] of Object.entries(snapshot.professions)) {
        const profession = GAME_PROFESSIONS[number]

        if (profession !== undefined) {
            proficiency[profession] = level
        }
    }

    return proficiency
}

// The game's counts and levels replace the ones typed in.
export const applyToCrafting = (
    settings: CraftingSettings,
    snapshots: GameSnapshot[],
): CraftingSettings => {
    const owned = getOwnedItems(snapshots, settings.server, settings.character)
    const proficiency = getProficiency(
        snapshots,
        settings.server,
        settings.character,
    )
    let next = settings

    if (owned !== null) {
        next = { ...next, owned: owned }
    }

    if (proficiency !== null) {
        next = {
            ...next,
            proficiency: { ...next.proficiency, ...proficiency },
        }
    }

    return next
}
