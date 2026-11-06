import { Flex, Heading } from "@chakra-ui/react"
import type { TaskEditGroup as TaskEditGroupData } from "@tracker/logic/taskEditGroups"
import type { TaskFields } from "@tracker/logic/trackerEdits"
import { TaskEditSection } from "./TaskEditSection"

type TaskEditGroupProps = {
    group: TaskEditGroupData
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
    onMove: (id: string, targetId: string) => void
}

export const TaskEditGroup = ({
    group,
    onChange,
    onDelete,
    onMove,
}: TaskEditGroupProps) => {
    return (
        <Flex as="section" flexDir="column" gap="3" aria-label={group.title}>
            <Heading as="h3" size="sm">
                {group.title}
            </Heading>

            {group.lists.map((list) => (
                <TaskEditSection
                    key={list.reset}
                    list={list}
                    onChange={onChange}
                    onDelete={onDelete}
                    onMove={onMove}
                />
            ))}
        </Flex>
    )
}
