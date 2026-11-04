import { Flex, Text } from "@chakra-ui/react"
import type { TaskEditResetList } from "@tracker/logic/taskEditGroups"
import type { TaskFields } from "@tracker/logic/trackerEdits"
import { TaskEditList } from "./TaskEditList"

type TaskEditSectionProps = {
    list: TaskEditResetList
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
    onMove: (id: string, offset: -1 | 1) => void
}

export const TaskEditSection = ({
    list,
    onChange,
    onDelete,
    onMove,
}: TaskEditSectionProps) => {
    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="label">{list.label}</Text>

            <TaskEditList
                tasks={list.tasks}
                onChange={onChange}
                onDelete={onDelete}
                onMove={onMove}
            />
        </Flex>
    )
}
