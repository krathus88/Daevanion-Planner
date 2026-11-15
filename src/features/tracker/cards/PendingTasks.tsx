import { Flex, Text } from "@chakra-ui/react"
import type { PendingTask } from "@tracker/logic/trackerCards"
import { PendingTaskChip } from "./PendingTaskChip"

type PendingTasksProps = {
    pending: PendingTask[]
}

// A minimized card's summary: an icon per task still left, on a panel like
// the task boxes. Nothing once all is done (the header's progress says so).
export const PendingTasks = ({ pending }: PendingTasksProps) => {
    if (pending.length === 0) {
        return null
    }

    return (
        <Flex
            px="3"
            py="1"
            flexWrap="wrap"
            alignItems="center"
            gap="1.5"
            bg="app.subcard"
            borderRadius="md"
        >
            <Text me="1" textStyle="caption">
                Left
            </Text>

            {pending.map((item) => (
                <PendingTaskChip key={item.task.id} item={item} />
            ))}
        </Flex>
    )
}
