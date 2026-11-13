import {
    CORRIDOR_TASK,
    CORRIDORS,
    getCorridorTaskId,
} from "@account/game/gameIds"
import type { TaskGroup } from "@tracker/logic/trackerCards"
import type { CorridorRecord, TrackerTask } from "@tracker/types"

// How a character's Corridors task looks this siege period.
export type CorridorView = {
    // The corridors its server's faction holds (artifact ids), each its own
    // 0/1 row; null while none are known since the siege (the task stays as
    // set up).
    artifacts: readonly string[] | null
    // While the companion runs: its entrances weren't read since the siege
    // (the game sends them on entering the Abyss), so the rows warn.
    unknown: boolean
}

export const getCorridorName = (artifact: string) => {
    const corridor = CORRIDORS.find((item) => item.artifact === artifact)

    return corridor?.name ?? `Corridor ${artifact}`
}

// Holdings sent since this period's siege set the rows. Without them, while
// the companion runs, nothing is known until the game says (a siege can be
// lost). Otherwise the task stays as the user set it up.
export const getCorridorView = (
    hold: CorridorRecord | undefined,
    left: CorridorRecord | undefined,
    siegePeriod: number,
    companionRunning: boolean,
): CorridorView | null => {
    const held = hold !== undefined && hold.period === siegePeriod

    if (!held && !companionRunning) {
        return null
    }

    return {
        artifacts: held ? hold.artifacts : null,
        unknown:
            companionRunning &&
            (!held ||
                (hold.artifacts.length > 0 &&
                    getCorridorsUsed(hold, left) === null)),
    }
}

// The rows a Corridors task shows for a view: one per held corridor.
const getCorridorRows = (task: TrackerTask, artifacts: readonly string[]) => {
    if (artifacts.length === 0) {
        return [{ ...task, cap: 0, subtitle: "None held" }]
    }

    return artifacts.map((artifact): TrackerTask => {
        return {
            ...task,
            id: getCorridorTaskId(artifact),
            name: getCorridorName(artifact),
            subtitle: "Abyss corridor",
            cap: 1,
        }
    })
}

// The groups with the Corridors task shown as the view says.
export const withCorridorView = (
    groups: TaskGroup[],
    artifacts: readonly string[] | null | undefined,
) => {
    if (artifacts === null || artifacts === undefined) {
        return groups
    }

    return groups.map((group) => {
        if (!group.tasks.some((task) => task.id === CORRIDOR_TASK)) {
            return group
        }

        return {
            ...group,
            tasks: group.tasks.flatMap((task) => {
                return task.id === CORRIDOR_TASK
                    ? getCorridorRows(task, artifacts)
                    : [task]
            }),
        }
    })
}

// The held corridors whose entrance is used: no longer open, once the
// character's entrances were read after that siege ended. Null while unknown.
export const getCorridorsUsed = (
    hold: CorridorRecord | undefined,
    left: CorridorRecord | undefined,
) => {
    if (hold === undefined || left === undefined || left.at < hold.at) {
        return null
    }

    return hold.artifacts.filter((artifact) => {
        return !left.artifacts.includes(artifact)
    })
}
