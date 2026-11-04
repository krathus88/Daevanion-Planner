import { Flex } from "@chakra-ui/react"
import type { TaskCount, TaskEntries, TrackerTask } from "@tracker/types"
import type {
    CountChangeHandler,
    EntriesChangeHandler,
    IgnoredChangeHandler,
} from "./taskHandlers"
import { TaskItem } from "./TaskItem"

type TaskTileProps = {
    task: TrackerTask
    owner: string
    ownerLabel: string
    period: number
    count?: TaskCount
    entries?: TaskEntries
    done: boolean
    // The whole box is done and green, so the tile drops its border.
    boxDone: boolean
    onCountChange: CountChangeHandler
    onEntriesChange: EntriesChangeHandler
    onIgnoredChange: IgnoredChangeHandler
}

const getTileColors = (done: boolean, boxDone: boolean) => {
    if (boxDone) {
        return { bg: "app.successTile", border: "transparent" } as const
    }

    if (done) {
        return { bg: "app.successTile", border: "app.successBorder" } as const
    }

    return { bg: "app.tile", border: "app.border" } as const
}

export const TaskTile = ({
    task,
    owner,
    ownerLabel,
    period,
    count,
    entries,
    done,
    boxDone,
    onCountChange,
    onEntriesChange,
    onIgnoredChange,
}: TaskTileProps) => {
    const colors = getTileColors(done, boxDone)

    return (
        <Flex
            p="1"
            flexDir="column"
            bg={colors.bg}
            borderColor={colors.border}
            borderWidth="1px"
            borderRadius="md"
        >
            <TaskItem
                task={task}
                owner={owner}
                ownerLabel={ownerLabel}
                period={period}
                count={count}
                entries={entries}
                ignored={false}
                onCountChange={onCountChange}
                onEntriesChange={onEntriesChange}
                onIgnoredChange={onIgnoredChange}
            />
        </Flex>
    )
}
