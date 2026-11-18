import { isArenaTaskKnown } from "@tracker/logic/arenaWeeks"
import { getTaskOwner } from "@tracker/logic/taskOwners"
import type { TrackerCharacter, TrackerData, TrackerTask } from "@tracker/types"
import {
    ARENA_TASKS,
    CORRIDOR_TASK,
    CRAFT_TASKS,
    DUTY_TASK,
    getServerId,
    LIMIT_TASKS,
    SHOP_TASKS,
    SUPPLY_TASK,
    TASK_COUNTERS,
} from "./gameIds"

// Ids the tracker locks besides task ids: a character's Odyle Energy and
// Hidden Cube keys rows.
export const ENERGY_LOCK = "energy"
export const CUBE_KEYS_LOCK = "cube-keys"

// Locked with no data yet: a shop goal (SHOP_TASKS) of a character that
// hasn't opened that shop while the companion ran. It shows no count and
// warns instead.
export const getUnknownLockId = (taskId: string) => {
    return `unknown:${taskId}`
}

// Owner (character id or server owner, see getTaskOwner) → what the
// companion app fills there.
export type CompanionLocks = Record<string, ReadonlySet<string>>

// What the companion fills for each tracker character it has a snapshot of,
// from readGameSections' lines: those fields take no input while it runs.
// Arena tasks lock only in a week whose start is known (`week`: the current
// weekly reset period). Shop goals lock for every character, known or not
// (getUnknownLockId), so they're never typed in by hand.
export const getCompanionLocks = (
    sections: string,
    characters: readonly TrackerCharacter[],
    tasks: readonly TrackerTask[],
    arena: TrackerData["arena"] = {},
    week = 0,
): CompanionLocks => {
    const locks: Record<string, Set<string>> = {}

    // Never used: nothing is filled, nothing locks.
    if (sections === "") {
        return locks
    }

    const lock = (owner: string, id: string) => {
        locks[owner] ??= new Set()
        locks[owner].add(id)
    }
    // "<character id>:<shop id>" for the shops a snapshot has counts from.
    const shopsRead = new Set<string>()

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
            const limit = LIMIT_TASKS[task.id]
            const filled =
                (section === "counters" &&
                    TASK_COUNTERS[task.id] !== undefined &&
                    task.recharge !== undefined) ||
                (section === "supply" && task.id === SUPPLY_TASK) ||
                (section === "duty" && task.id === DUTY_TASK) ||
                (section === "corridors" && task.id === CORRIDOR_TASK) ||
                (section === "arena" &&
                    ARENA_TASKS[task.id] !== undefined &&
                    isArenaTaskKnown(arena[character.id], week, task.id)) ||
                (craft !== undefined && section === `crafts.${craft.recipe}`) ||
                (limit !== undefined &&
                    limit.limits.some((id) => section === `limits.${id}`))

            if (filled) {
                lock(getTaskOwner(task, character), task.id)
            }
        }

        if (section.startsWith("shops.")) {
            shopsRead.add(`${character.id}:${section.slice("shops.".length)}`)
        }

        if (section === "counters") {
            lock(character.id, ENERGY_LOCK)
        }

        if (section === "items") {
            lock(character.id, CUBE_KEYS_LOCK)
        }
    }

    for (const character of characters) {
        for (const task of tasks) {
            const shop = SHOP_TASKS[task.id]

            if (shop === undefined) {
                continue
            }

            const owner = getTaskOwner(task, character)

            lock(owner, task.id)

            if (!shopsRead.has(`${character.id}:${shop.shop}`)) {
                lock(owner, getUnknownLockId(task.id))
            }
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
