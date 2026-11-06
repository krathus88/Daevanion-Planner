import { getServer } from "@timers/config/servers"
import type {
    TaskCount,
    TaskEntries,
    TrackerCharacter,
    TrackerReset,
    TrackerTask,
} from "@tracker/types"
import { readCount, type ResetPeriods } from "./resetPeriods"
import { readEntries } from "./taskEntries"
import { getServerOwner } from "./taskOwners"
import { getTaskSections } from "./taskSections"

export type ServerGroup = {
    server: string
    name: string
    characters: TrackerCharacter[]
}

export type TaskGroup = {
    reset: TrackerReset
    label: string
    tasks: TrackerTask[]
}

export type TaskControl = "check" | "pips" | "stepper" | "entries"

export type CardProgress = {
    done: number
    total: number
}

// Caps up to this get a button per step; higher ones a stepper.
const MAX_PIPS = 6

// The servers the characters are on, in the order they first appear.
export const getServerGroups = (characters: readonly TrackerCharacter[]) => {
    const groups: ServerGroup[] = []

    for (const character of characters) {
        const group = groups.find((item) => item.server === character.server)

        if (group) {
            group.characters.push(character)
        } else {
            groups.push({
                server: character.server,
                name: getServer(character.server).name,
                characters: [character],
            })
        }
    }

    return groups
}

// Every card shown, by owner: each server's (if any tasks are shared), then
// each character's (if any aren't).
export const getCardOwners = (
    characters: readonly TrackerCharacter[],
    hasShared: boolean,
    hasOwn: boolean,
) => {
    const owners: string[] = []

    if (hasShared) {
        for (const group of getServerGroups(characters)) {
            owners.push(getServerOwner(group.server))
        }
    }

    if (hasOwn) {
        for (const character of characters) {
            owners.push(character.id)
        }
    }

    return owners
}

// A card's tasks by reset: the shared ones for a server card, the rest for
// a character card. Resets with none are left out.
export const getTaskGroups = (
    tasks: readonly TrackerTask[],
    shared: boolean,
) => {
    const groups: TaskGroup[] = []

    for (const section of getTaskSections(tasks)) {
        const sectionTasks = shared ? section.sharedTasks : section.tasks

        if (sectionTasks.length > 0) {
            groups.push({
                reset: section.reset,
                label: section.label,
                tasks: sectionTasks,
            })
        }
    }

    return groups
}

// The tasks in `ids` apart from the rest, both by reset. Groups left empty
// are dropped.
const splitTasks = (groups: readonly TaskGroup[], ids: readonly string[]) => {
    const kept: TaskGroup[] = []
    const moved: TaskGroup[] = []

    for (const group of groups) {
        const keptTasks: TrackerTask[] = []
        const movedTasks: TrackerTask[] = []

        for (const task of group.tasks) {
            if (ids.includes(task.id)) {
                movedTasks.push(task)
            } else {
                keptTasks.push(task)
            }
        }

        if (keptTasks.length > 0) {
            kept.push({ ...group, tasks: keptTasks })
        }

        if (movedTasks.length > 0) {
            moved.push({ ...group, tasks: movedTasks })
        }
    }

    return { kept: kept, moved: moved }
}

// A card's groups without the ignored tasks, and the ignored ones apart.
export const splitIgnored = (
    groups: readonly TaskGroup[],
    ignored: readonly string[],
) => {
    const split = splitTasks(groups, ignored)

    return { active: split.kept, ignored: split.moved }
}

// Active groups without the stashed done tasks, and those apart.
export const splitDone = (
    groups: readonly TaskGroup[],
    stashed: readonly string[],
) => {
    const split = splitTasks(groups, stashed)

    return { todo: split.kept, done: split.moved }
}

// Ids of the tasks done in their reset period, ignored ones left out.
export const getDoneTaskIds = (
    groups: readonly TaskGroup[],
    counts: Record<string, TaskCount> | undefined,
    entries: Record<string, TaskEntries> | undefined,
    ignored: readonly string[],
    periods: ResetPeriods,
) => {
    const done: string[] = []

    for (const group of groups) {
        for (const task of group.tasks) {
            if (
                !ignored.includes(task.id) &&
                isTaskDone(
                    task,
                    counts?.[task.id],
                    entries?.[task.id],
                    periods[group.reset],
                )
            ) {
                done.push(task.id)
            }
        }
    }

    return done
}

export const countTasks = (groups: readonly TaskGroup[]) => {
    let count = 0

    for (const group of groups) {
        count += group.tasks.length
    }

    return count
}

export const getTaskControl = (task: TrackerTask): TaskControl => {
    if (task.recharge !== undefined) {
        return "entries"
    }

    if (task.cap === 1) {
        return "check"
    }

    return task.cap <= MAX_PIPS ? "pips" : "stepper"
}

// Done at its cap; an entry task once its recharged entries are all used
// (bonus tickets don't count, they carry over).
export const isTaskDone = (
    task: TrackerTask,
    count: TaskCount | undefined,
    entries: TaskEntries | undefined,
    period: number,
) => {
    if (task.recharge !== undefined) {
        return readEntries(task, entries, period).base === 0
    }

    return readCount(count, period) >= task.cap
}

export type PendingTask = {
    task: TrackerTask
    // Where it stands, e.g. "12/30" or "13 left".
    detail: string
}

// What a minimized card still lists: the tasks not done yet, not ignored.
export const getPendingTasks = (
    groups: readonly TaskGroup[],
    counts: Record<string, TaskCount> | undefined,
    entries: Record<string, TaskEntries> | undefined,
    ignored: readonly string[],
    periods: ResetPeriods,
) => {
    const pending: PendingTask[] = []

    for (const group of groups) {
        const period = periods[group.reset]

        for (const task of group.tasks) {
            const count = counts?.[task.id]
            const taskEntries = entries?.[task.id]

            if (
                ignored.includes(task.id) ||
                isTaskDone(task, count, taskEntries, period)
            ) {
                continue
            }

            const detail =
                task.recharge !== undefined
                    ? `${readEntries(task, taskEntries, period).base} left`
                    : `${readCount(count, period)}/${task.cap}`

            pending.push({ task: task, detail: detail })
        }
    }

    return pending
}

// The counts a pip control has a button for: 1 up to the cap.
export const getPipSteps = (cap: number) => {
    const steps: number[] = []

    for (let step = 1; step <= cap; step++) {
        steps.push(step)
    }

    return steps
}

// Clicking the highest filled pip clears the count; any other sets it.
export const getPipCount = (count: number, step: number) => {
    return step === count ? 0 : step
}

// Done tasks out of one reset's tasks that aren't ignored.
export const getGroupProgress = (
    group: TaskGroup,
    counts: Record<string, TaskCount> | undefined,
    entries: Record<string, TaskEntries> | undefined,
    ignored: readonly string[],
    period: number,
): CardProgress => {
    let done = 0
    let total = 0

    for (const task of group.tasks) {
        if (ignored.includes(task.id)) {
            continue
        }

        total += 1

        if (isTaskDone(task, counts?.[task.id], entries?.[task.id], period)) {
            done += 1
        }
    }

    return { done: done, total: total }
}

// Done tasks out of a card's tasks that aren't ignored.
export const getCardProgress = (
    groups: readonly TaskGroup[],
    counts: Record<string, TaskCount> | undefined,
    entries: Record<string, TaskEntries> | undefined,
    ignored: readonly string[],
    periods: ResetPeriods,
): CardProgress => {
    let done = 0
    let total = 0

    for (const group of groups) {
        const progress = getGroupProgress(
            group,
            counts,
            entries,
            ignored,
            periods[group.reset],
        )

        done += progress.done
        total += progress.total
    }

    return { done: done, total: total }
}
