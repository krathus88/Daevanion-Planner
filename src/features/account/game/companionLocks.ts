import { getTaskOwner } from "@tracker/logic/taskOwners"
import type { TrackerCharacter, TrackerData, TrackerTask } from "@tracker/types"
import {
    ARENA_TASKS,
    CORRIDOR_TASK,
    CRAFT_TASKS,
    DUTY_TASK,
    getServerId,
    SUPPLY_TASK,
    TASK_COUNTERS,
} from "./gameIds"

// Ids the tracker locks besides task ids: a character's Odyle Energy and
// Hidden Cube keys rows.
export const ENERGY_LOCK = "energy"
export const CUBE_KEYS_LOCK = "cube-keys"

// Owner (character id or server owner, see getTaskOwner) → what the
// companion app fills there.
export type CompanionLocks = Record<string, ReadonlySet<string>>

// What the companion fills for each tracker character it has a snapshot of,
// from readGameSections' lines: those fields take no input while it runs.
// Arena tasks lock only in a week whose start is known (`week`: the current
// weekly reset period).
export const getCompanionLocks = (
    sections: string,
    characters: readonly TrackerCharacter[],
    tasks: readonly TrackerTask[],
    arena: TrackerData["arena"] = {},
    week = 0,
): CompanionLocks => {
    const locks: Record<string, Set<string>> = {}
    const lock = (owner: string, id: string) => {
        locks[owner] ??= new Set()
        locks[owner].add(id)
    }

    for (const line of sections.split("\n")) {
        const [server, name, section] = line.split(":")
        const serverId = getServerId(Number(server))
        const character = characters.find((item) => {
            return (
                item.server === serverId &&
                item.name.trim().toLowerCase() === name?.toLowerCase()
            )
        })

        if (character === undefined || section === undefined) {
            continue
        }

        for (const task of tasks) {
            const craft = CRAFT_TASKS[task.id]
            const filled =
                (section === "counters" &&
                    TASK_COUNTERS[task.id] !== undefined &&
                    task.recharge !== undefined) ||
                (section === "supply" && task.id === SUPPLY_TASK) ||
                (section === "duty" && task.id === DUTY_TASK) ||
                (section === "corridors" && task.id === CORRIDOR_TASK) ||
                (section === "arena" &&
                    ARENA_TASKS[task.id] !== undefined &&
                    arena[character.id]?.base?.period === week) ||
                (craft !== undefined && section === `crafts.${craft.recipe}`)

            if (filled) {
                lock(getTaskOwner(task, character), task.id)
            }
        }

        if (section === "counters") {
            lock(character.id, ENERGY_LOCK)
        }

        if (section === "items") {
            lock(character.id, CUBE_KEYS_LOCK)
        }
    }

    return locks
}

// Whether any snapshot holds a section (on a site server id and of a
// character, when given), from readGameSections' lines.
export const hasGameSection = (
    sections: string,
    section: string,
    server?: string,
    name?: string,
) => {
    return sections.split("\n").some((line) => {
        const [lineServer, lineName, lineSection] = line.split(":")

        return (
            lineSection === section &&
            (server === undefined ||
                getServerId(Number(lineServer)) === server) &&
            (name === undefined || lineName === name)
        )
    })
}
