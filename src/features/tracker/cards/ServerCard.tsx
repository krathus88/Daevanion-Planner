import { Icon, Text } from "@chakra-ui/react"
import { getCharacterName } from "@tracker/logic/characterName"
import type { ResetPeriods } from "@tracker/logic/resetPeriods"
import { getServerOwner } from "@tracker/logic/taskOwners"
import type { ServerGroup, TaskGroup } from "@tracker/logic/trackerCards"
import type { TrackerData } from "@tracker/types"
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
    counts: TrackerData["counts"]
    entries: TrackerData["entries"]
    minimized: string[]
    ignored: TrackerData["ignored"]
    periods: ResetPeriods
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onMinimizedChange: (owner: string, minimized: boolean) => void
    onIgnoredChange: IgnoredChangeHandler
}

// The server's shared tasks, across the page.
export const ServerCard = ({
    group,
    taskGroups,
    counts,
    entries,
    minimized,
    ignored,
    periods,
    onCountChange,
    onEntriesChange,
    onMinimizedChange,
    onIgnoredChange,
}: ServerCardProps) => {
    const owner = getServerOwner(group.server)
    const names = group.characters.map(getCharacterName).join(", ")

    return (
        <TaskCard
            title={group.name}
            owner={owner}
            ownerLabel={group.name}
            taskGroups={taskGroups}
            periods={periods}
            counts={counts[owner]}
            entries={entries[owner]}
            ignored={ignored[owner]}
            wide
            minimized={minimized.includes(owner)}
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
        />
    )
}
