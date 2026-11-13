import { CORRIDOR_TASK, CORRIDORS } from "@account/game/gameIds"
import type { TaskGroup } from "@tracker/logic/trackerCards"
import type { CorridorRecord, TrackerTask } from "@tracker/types"

// How a character's Corridors task looks this siege period: one entrance per
// corridor its server's faction holds, named on the task's second line.
export type CorridorView = {
    cap: number
    subtitle: string
}

export const getCorridorName = (artifact: string) => {
    const corridor = CORRIDORS.find((item) => item.artifact === artifact)

    return corridor?.name ?? `Corridor ${artifact}`
}

// Holdings sent since this period's siege set the task. Without them, while
// the companion runs, none are assumed until the game says (user's rule):
// a siege can be lost. Otherwise the task stays as the user set it up.
export const getCorridorView = (
    hold: CorridorRecord | undefined,
    siegePeriod: number,
    companionRunning: boolean,
): CorridorView | null => {
    if (hold !== undefined && hold.period === siegePeriod) {
        return {
            cap: hold.artifacts.length,
            subtitle:
                hold.artifacts.length > 0
                    ? hold.artifacts.map(getCorridorName).join(" · ")
                    : "None held",
        }
    }

    if (companionRunning) {
        return { cap: 0, subtitle: "None known since the siege" }
    }

    return null
}

// The groups with the Corridors task shown as the view says.
export const withCorridorView = (
    groups: TaskGroup[],
    view: CorridorView | null,
) => {
    if (view === null) {
        return groups
    }

    return groups.map((group) => {
        if (!group.tasks.some((task) => task.id === CORRIDOR_TASK)) {
            return group
        }

        return {
            ...group,
            tasks: group.tasks.map((task): TrackerTask => {
                return task.id === CORRIDOR_TASK
                    ? { ...task, cap: view.cap, subtitle: view.subtitle }
                    : task
            }),
        }
    })
}

// Entrances used: held corridors the character no longer has, once its
// entrances were read after that siege ended. Null while unknown.
export const getCorridorsUsed = (
    hold: CorridorRecord | undefined,
    left: CorridorRecord | undefined,
) => {
    if (hold === undefined || left === undefined || left.at < hold.at) {
        return null
    }

    return hold.artifacts.filter((artifact) => {
        return !left.artifacts.includes(artifact)
    }).length
}
