import { Flex, Icon, Text } from "@chakra-ui/react"
import type { PendingTask } from "@tracker/logic/trackerCards"
import { LuCheck } from "react-icons/lu"
import { PendingTaskChip } from "./PendingTaskChip"

type PendingTasksProps = {
    pending: PendingTask[]
}

// A minimized card's summary: an icon per task still left.
export const PendingTasks = ({ pending }: PendingTasksProps) => {
    if (pending.length === 0) {
        return (
            <Flex alignItems="center" gap="1.5" color="app.success">
                <Icon boxSize="4">
                    <LuCheck />
                </Icon>

                <Text fontSize="sm">All done</Text>
            </Flex>
        )
    }

    return (
        <Flex flexWrap="wrap" alignItems="center" gap="1.5">
            <Text me="1" textStyle="caption">
                Left
            </Text>

            {pending.map((item) => (
                <PendingTaskChip key={item.task.id} item={item} />
            ))}
        </Flex>
    )
}
