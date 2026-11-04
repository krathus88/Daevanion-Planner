import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import type { TaskGroup } from "@tracker/logic/trackerCards"
import type { TaskCount, TaskEntries } from "@tracker/types"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"
import { TaskGroupList } from "./TaskGroupList"

type TaskGroupsProps = {
    groups: TaskGroup[]
    owner: string
    ownerLabel: string
    // Whether these are the owner's ignored tasks.
    ignored: boolean
    periods: ResetPeriods
    counts?: Record<string, TaskCount>
    entries?: Record<string, TaskEntries>
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onIgnoredChange: IgnoredChangeHandler
}

// A list per reset, one under another.
export const TaskGroups = ({
    groups,
    owner,
    ownerLabel,
    ignored,
    periods,
    counts,
    entries,
    onCountChange,
    onEntriesChange,
    onIgnoredChange,
}: TaskGroupsProps) => {
    return groups.map((group) => (
        <TaskGroupList
            key={group.reset}
            group={group}
            owner={owner}
            ownerLabel={ownerLabel}
            ignored={ignored}
            period={periods[group.reset]}
            counts={counts}
            entries={entries}
            onCountChange={onCountChange}
            onEntriesChange={onEntriesChange}
            onIgnoredChange={onIgnoredChange}
        />
    ))
}
