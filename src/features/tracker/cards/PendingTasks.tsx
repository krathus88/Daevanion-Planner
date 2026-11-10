import { Flex, Icon, Text } from "@chakra-ui/react"
import type { PendingTask } from "@tracker/logic/trackerCards"
import { LuCheck } from "react-icons/lu"
import { PendingTaskChip } from "./PendingTaskChip"

type PendingTasksProps = {
    pending: PendingTask[]
}

// A minimized card's summary: an icon per task still left, on a panel like
// the task boxes (green like a finished box once nothing is left).
export const PendingTasks = ({ pending }: PendingTasksProps) => {
    if (pending.length === 0) {
        return (
            <Flex
                px="3"
                py="2"
                alignItems="center"
                gap="1.5"
                bg="app.successFill"
                borderRadius="md"
                color="app.success"
            >
                <Icon boxSize="4">
                    <LuCheck />
                </Icon>

                <Text fontSize="sm">All done</Text>
            </Flex>
        )
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
