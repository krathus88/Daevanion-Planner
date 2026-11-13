import { Flex } from "@chakra-ui/react"
import {
    ARENA_TASKS,
    CORRIDOR_TASK,
    isCorridorTask,
} from "@account/game/gameIds"
import { readCount } from "@tracker/logic/resetPeriods"
import { getTaskControl, isTaskDone } from "@tracker/logic/trackerCards"
import { readEntries, type EntriesLeft } from "@tracker/logic/taskEntries"
import { getTaskTitle } from "@tracker/logic/taskTitle"
import {
    useArenaUnknown,
    useCorridorsUnknown,
    useIsLocked,
} from "@tracker/context/companionLocks"
import type { TaskCount, TaskEntries, TrackerTask } from "@tracker/types"
import { ArenaWeekWarning } from "./ArenaWeekWarning"
import { CorridorsWarning } from "./CorridorsWarning"
import { LockedTaskCount } from "./LockedTaskCount"
import { IgnoreToggle } from "./IgnoreToggle"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"
import { TaskEntriesCounter } from "./TaskEntriesCounter"
import { TaskName } from "./TaskName"
import { TaskPips } from "./TaskPips"
import { TaskStepper } from "./TaskStepper"

type TaskItemProps = {
    task: TrackerTask
    owner: string
    ownerLabel: string
    period: number
    count?: TaskCount
    entries?: TaskEntries
    // Skipped for good: dimmed, still usable, left out of the progress.
    ignored: boolean
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onIgnoredChange: IgnoredChangeHandler
}

// One task in a card: its name, the control that fits its cap, and a
// toggle to ignore it in the top right corner.
export const TaskItem = ({
    task,
    owner,
    ownerLabel,
    period,
    count,
    entries,
    ignored,
    onCountChange,
    onEntriesChange,
    onIgnoredChange,
}: TaskItemProps) => {
    const handleCountChange = (next: number) => {
        onCountChange(owner, task, period, next)
    }

    const handleEntriesChange = (next: EntriesLeft) => {
        onEntriesChange(owner, task, period, next)
    }

    const handleIgnoredChange = (next: boolean) => {
        onIgnoredChange(owner, task.id, next)
    }

    const corridor = isCorridorTask(task.id)
    const corridorUnknown = useCorridorsUnknown() && corridor
    // Corridor rows share the Corridors task's lock.
    const locked =
        useIsLocked(owner, corridor ? CORRIDOR_TASK : task.id) &&
        !corridorUnknown
    const arena = useArenaUnknown()
    const arenaUnknown =
        arena.owners.has(owner) && ARENA_TASKS[task.id] !== undefined
    const control = getTaskControl(task)
    const label = `${getTaskTitle(task)}, ${ownerLabel}`
    const current = readCount(count, period)
    const isDone = !ignored && isTaskDone(task, count, entries, period)
    // Wide controls go under the name, or beside it in a tile wide enough for
    // both (all tiles in a box share a width, so they switch together); pips
    // always sit beside it, like a locked task's number.
    const isStacked =
        !locked && (control === "entries" || control === "stepper")

    return (
        <Flex
            // For the ignore toggle, top right, shown on hover.
            className="group"
            pos="relative"
            // For the wide controls' container query.
            css={{ containerType: "inline-size" }}
            // One-line rows keep their right-hand control clear of it.
            pe={isStacked ? undefined : "6"}
            alignItems="center"
            opacity={ignored ? "dimmed" : undefined}
        >
            <Flex
                px="2"
                py="1.5"
                minW="0"
                minH="10"
                flex="1"
                flexDir={isStacked ? "column" : "row"}
                // A locked number is short: it stays on the name's line,
                // the name giving way, so every tile's sits at the same spot.
                flexWrap={locked ? "nowrap" : "wrap"}
                alignItems={isStacked ? "flex-start" : "center"}
                justifyContent="space-between"
                columnGap="3"
                rowGap="1"
                // Room for the name (8rem, longer ones wrap) beside the
                // widest control (entries, 13.5rem), gap and padding.
                css={
                    isStacked
                        ? {
                              "@container (min-width: 23.5rem)": {
                                  flexDirection: "row",
                                  flexWrap: "nowrap",
                                  alignItems: "center",
                                  "& > :first-of-type": { minWidth: "32" },
                              },
                          }
                        : locked
                          ? { "& > :first-of-type": { minWidth: "0" } }
                          : undefined
                }
            >
                <TaskName
                    task={task}
                    done={isDone}
                    ignored={ignored}
                    warning={
                        (arenaUnknown && (
                            <ArenaWeekWarning
                                label={label}
                                onConfirm={() => arena.onConfirm(owner, period)}
                            />
                        )) ||
                        (corridorUnknown && (
                            <CorridorsWarning
                                label={label}
                                ownerLabel={ownerLabel}
                            />
                        ))
                    }
                />

                {locked ? (
                    <LockedTaskCount
                        entries={
                            control === "entries"
                                ? readEntries(task, entries, period)
                                : undefined
                        }
                        count={current}
                        cap={task.cap}
                        bonusCap={task.bonusCap ?? 0}
                        label={label}
                    />
                ) : (
                    <>
                        {control === "entries" && (
                            <TaskEntriesCounter
                                left={readEntries(task, entries, period)}
                                cap={task.cap}
                                bonusCap={task.bonusCap ?? 0}
                                label={label}
                                onChange={handleEntriesChange}
                            />
                        )}

                        {control === "pips" && (
                            <TaskPips
                                count={current}
                                cap={task.cap}
                                label={label}
                                onChange={handleCountChange}
                            />
                        )}

                        {control === "stepper" && (
                            <TaskStepper
                                count={current}
                                cap={task.cap}
                                label={label}
                                onChange={handleCountChange}
                            />
                        )}
                    </>
                )}
            </Flex>

            <IgnoreToggle
                ignored={ignored}
                label={label}
                onChange={handleIgnoredChange}
            />
        </Flex>
    )
}
