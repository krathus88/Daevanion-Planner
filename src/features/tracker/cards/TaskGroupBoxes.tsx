import { Flex } from "@chakra-ui/react"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import type { TaskGroup } from "@tracker/logic/trackerCards"
import type { TaskCount, TaskEntries } from "@tracker/types"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"
import { TaskGroupBox, type BoxSizing } from "./TaskGroupBox"

type TaskGroupBoxesProps = {
    groups: TaskGroup[]
    owner: string
    ownerLabel: string
    periods: ResetPeriods
    // A full-width card lines its boxes up with the Characters columns.
    wide: boolean
    counts?: Record<string, TaskCount>
    entries?: Record<string, TaskEntries>
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onIgnoredChange: IgnoredChangeHandler
}

// A box per reset, each keeping its own height. On a narrow card they wrap,
// each taking width by its number of tasks. On a wide one every box but the
// last ends with the first Characters column and the last takes the rest,
// until it can't fit two tiles a row there: then it wraps to a row of its own.
export const TaskGroupBoxes = ({
    groups,
    owner,
    ownerLabel,
    periods,
    wide,
    counts,
    entries,
    onCountChange,
    onEntriesChange,
    onIgnoredChange,
}: TaskGroupBoxesProps) => {
    const getSizing = (index: number): BoxSizing => {
        if (!wide) {
            return "share"
        }

        return index === groups.length - 1 ? "fill" : "column"
    }

    return (
        <Flex flexWrap="wrap" alignItems="flex-start" gap={wide ? "4" : "3"}>
            {groups.map((group, index) => (
                <TaskGroupBox
                    key={group.reset}
                    group={group}
                    sizing={getSizing(index)}
                    owner={owner}
                    ownerLabel={ownerLabel}
                    period={periods[group.reset]}
                    counts={counts}
                    entries={entries}
                    onCountChange={onCountChange}
                    onEntriesChange={onEntriesChange}
                    onIgnoredChange={onIgnoredChange}
                />
            ))}
        </Flex>
    )
}
