import { Flex, Text } from "@chakra-ui/react"
import type { TaskSection } from "@tracker/logic/taskSections"
import type { TaskFields } from "@tracker/logic/trackerEdits"
import { TaskEditList } from "./TaskEditList"

type TaskEditSectionProps = {
    section: TaskSection
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
    onMove: (id: string, offset: -1 | 1) => void
}

export const TaskEditSection = ({
    section,
    onChange,
    onDelete,
    onMove,
}: TaskEditSectionProps) => {
    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="label">{section.label}</Text>

            <TaskEditList
                tasks={section.tasks}
                onChange={onChange}
                onDelete={onDelete}
                onMove={onMove}
            />

            {section.sharedTasks.length > 0 && (
                <Text color="app.muted" fontSize="xs" fontWeight="semibold">
                    Shared by server
                </Text>
            )}

            <TaskEditList
                tasks={section.sharedTasks}
                onChange={onChange}
                onDelete={onDelete}
                onMove={onMove}
            />
        </Flex>
    )
}
