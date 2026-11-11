import { Icon, Text } from "@chakra-ui/react"
import { getCharacterName } from "@tracker/logic/characterName"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import { getServerOwner } from "@tracker/logic/taskOwners"
import type { ServerGroup, TaskGroup } from "@tracker/logic/trackerCards"
import type { TaskCount, TaskEntries } from "@tracker/types"
import { memo } from "react"
import { LuServer } from "react-icons/lu"
import { TaskCard } from "./TaskCard"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"

type ServerCardProps = {
    group: ServerGroup
    taskGroups: TaskGroup[]
    // The server's own slices of the data (see memo below).
    counts?: Record<string, TaskCount>
    entries?: Record<string, TaskEntries>
    minimized: boolean
    // Whether its One-off box is open.
    goalsOpen: boolean
    ignored?: string[]
    periods: ResetPeriods
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onMinimizedChange: (owner: string, minimized: boolean) => void
    onIgnoredChange: IgnoredChangeHandler
    onGoalsOpenChange: (owner: string, open: boolean) => void
}

// The server's shared tasks, across the page. memo: the board re-maps every
// card when one changes, and the compiler can't skip cards inside that map.
export const ServerCard = memo(function ServerCard({
    group,
    taskGroups,
    counts,
    entries,
    minimized,
    goalsOpen,
    ignored,
    periods,
    onCountChange,
    onEntriesChange,
    onMinimizedChange,
    onIgnoredChange,
    onGoalsOpenChange,
}: ServerCardProps) {
    const owner = getServerOwner(group.server)
    const names = group.characters.map(getCharacterName).join(", ")

    return (
        <TaskCard
            title={group.name}
            owner={owner}
            ownerLabel={group.name}
            taskGroups={taskGroups}
            periods={periods}
            counts={counts}
            entries={entries}
            ignored={ignored}
            wide
            minimized={minimized}
            goalsOpen={goalsOpen}
            icon={
                <Icon boxSize="5" color="app.info">
                    <LuServer />
                </Icon>
            }
            subtitle={
                <Text as="span" textStyle="caption" truncate>
                    Shared by {names}
                </Text>
            }
            onCountChange={onCountChange}
            onEntriesChange={onEntriesChange}
            onMinimizedChange={onMinimizedChange}
            onIgnoredChange={onIgnoredChange}
            onGoalsOpenChange={onGoalsOpenChange}
        />
    )
})
