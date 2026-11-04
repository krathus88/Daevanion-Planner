import { Flex, Grid, Text } from "@chakra-ui/react"
import type { TaskGroup } from "@tracker/logic/trackerCards"
import type { TaskCount, TaskEntries } from "@tracker/types"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"
import { TaskItem } from "./TaskItem"

type TaskGroupListProps = {
    group: TaskGroup
    owner: string
    ownerLabel: string
    // Whether these are the owner's ignored tasks.
    ignored: boolean
    period: number
    counts?: Record<string, TaskCount>
    entries?: Record<string, TaskEntries>
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onIgnoredChange: IgnoredChangeHandler
}

export const TaskGroupList = ({
    group,
    owner,
    ownerLabel,
    ignored,
    period,
    counts,
    entries,
    onCountChange,
    onEntriesChange,
    onIgnoredChange,
}: TaskGroupListProps) => {
    return (
        <Flex flexDir="column" gap="1">
            <Text px="2" textStyle="label">
                {group.label}
            </Text>

            {/* Tile-wide columns, so on a wide card the controls stay by the name. */}
            <Grid
                templateColumns="repeat(auto-fill, minmax(min(100%, 17rem), 1fr))"
                columnGap="2"
                rowGap="1"
            >
                {group.tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        owner={owner}
                        ownerLabel={ownerLabel}
                        period={period}
                        count={counts?.[task.id]}
                        entries={entries?.[task.id]}
                        ignored={ignored}
                        onCountChange={onCountChange}
                        onEntriesChange={onEntriesChange}
                        onIgnoredChange={onIgnoredChange}
                    />
                ))}
            </Grid>
        </Flex>
    )
}
