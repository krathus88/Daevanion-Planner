import { parseTrackerData } from "@tracker/storage/trackerData"
import type { TaskCount, TrackerData } from "@tracker/types"

// The newer side's entries in its order, then the older side's missing ones.
const mergeById = <T extends { id: string }>(
    newer: readonly T[],
    older: readonly T[],
) => {
    const merged = [...newer]
    const seen = new Set(newer.map((item) => item.id))

    for (const item of older) {
        if (!seen.has(item.id)) {
            merged.push(item)
        }
    }

    return merged
}

// The later period wins; in the same period, the higher count.
const pickCount = (a: TaskCount, b: TaskCount) => {
    if (a.period !== b.period) {
        return a.period > b.period ? a : b
    }

    return a.count >= b.count ? a : b
}

const mergeCounts = (
    newer: TrackerData["counts"],
    older: TrackerData["counts"],
) => {
    const merged: TrackerData["counts"] = {}

    for (const [characterId, perTask] of Object.entries(newer)) {
        merged[characterId] = { ...perTask }
    }

    for (const [characterId, perTask] of Object.entries(older)) {
        const target = merged[characterId] ?? {}

        for (const [taskId, count] of Object.entries(perTask)) {
            const current = target[taskId]

            target[taskId] = current ? pickCount(current, count) : count
        }

        merged[characterId] = target
    }

    return merged
}

// Entries left: the later period wins; in the same period the newer side's,
// since a run and a bonus ticket can move them either way.
const mergeEntries = (
    newer: TrackerData["entries"],
    older: TrackerData["entries"],
) => {
    const merged: TrackerData["entries"] = {}

    for (const [owner, perTask] of Object.entries(newer)) {
        merged[owner] = { ...perTask }
    }

    for (const [owner, perTask] of Object.entries(older)) {
        const target = merged[owner] ?? {}

        for (const [taskId, entries] of Object.entries(perTask)) {
            const current = target[taskId]

            if (!current || entries.period > current.period) {
                target[taskId] = entries
            }
        }

        merged[owner] = target
    }

    return merged
}

// Odyle Energy per character: the later recharge wins; in the same one the
// newer side's, since cubes and items move it either way.
const mergeEnergy = (
    newer: TrackerData["energy"],
    older: TrackerData["energy"],
) => {
    const merged = { ...newer }

    for (const [characterId, energy] of Object.entries(older)) {
        const current = merged[characterId]

        if (!current || energy.period > current.period) {
            merged[characterId] = energy
        }
    }

    return merged
}

// Per character, the record seen last.
const mergeArena = (
    newer: TrackerData["arena"],
    older: TrackerData["arena"],
) => {
    const merged = { ...newer }

    for (const [characterId, record] of Object.entries(older)) {
        const current = merged[characterId]

        if (!current || record.seen.at > current.seen.at) {
            merged[characterId] = record
        }
    }

    return merged
}

// Characters and tasks by id, counts and entries one by one. A list removed on one side
// comes back from the other, like saved plans.
export const mergeTrackerData = (newer: unknown, older: unknown) => {
    const newerData = parseTrackerData(newer)
    const olderData = parseTrackerData(older)

    const tasks =
        newerData.tasks && olderData.tasks
            ? mergeById(newerData.tasks, olderData.tasks)
            : (newerData.tasks ?? olderData.tasks)

    return {
        characters: mergeById(newerData.characters, olderData.characters),
        tasks: tasks,
        // Both sides already took in the starter tasks they lacked.
        presets: newerData.presets,
        counts: mergeCounts(newerData.counts, olderData.counts),
        entries: mergeEntries(newerData.entries, olderData.entries),
        // Choices about the view and the list: the side edited last.
        minimized: newerData.minimized,
        goalsOpen: newerData.goalsOpen,
        ignored: newerData.ignored,
        energy: mergeEnergy(newerData.energy, olderData.energy),
        // Per character, the newer side's count.
        cubeKeys: { ...olderData.cubeKeys, ...newerData.cubeKeys },
        arena: mergeArena(newerData.arena, olderData.arena),
        // Declined on either side stays declined.
        declined: [...new Set([...newerData.declined, ...olderData.declined])],
        // Per character, the newer side's note.
        notes: { ...olderData.notes, ...newerData.notes },
        membership: newerData.membership,
    }
}
