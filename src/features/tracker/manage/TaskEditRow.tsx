import { Flex, Input } from "@chakra-ui/react"
import { ConfirmButton } from "@common/ConfirmButton"
import { MoveButtons } from "@common/MoveButtons"
import { WholeNumberInput } from "@common/WholeNumberInput"
import { getTaskTitle } from "@tracker/logic/taskTitle"
import type { TaskFields } from "@tracker/logic/trackerEdits"
import type { TrackerReset, TrackerTask } from "@tracker/types"
import type { ChangeEvent } from "react"
import { LuTrash2 } from "react-icons/lu"
import { TaskResetSelect } from "./TaskResetSelect"
import { TaskSharedToggle } from "./TaskSharedToggle"

type TaskEditRowProps = {
    task: TrackerTask
    first: boolean
    last: boolean
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
    onMove: (id: string, offset: -1 | 1) => void
}

export const TaskEditRow = ({
    task,
    first,
    last,
    onChange,
    onDelete,
    onMove,
}: TaskEditRowProps) => {
    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(task.id, { ...task, name: event.target.value })
    }

    const handleSubtitleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(task.id, { ...task, subtitle: event.target.value })
    }

    const handleCapChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(task.id, { ...task, cap: Number(event.target.value || "1") })
    }

    const handleResetChange = (reset: TrackerReset) => {
        onChange(task.id, { ...task, reset: reset })
    }

    const handleSharedChange = (shared: boolean) => {
        onChange(task.id, { ...task, shared: shared })
    }

    const handleMove = (offset: -1 | 1) => {
        onMove(task.id, offset)
    }

    const handleDelete = () => {
        onDelete(task.id)
    }

    // Shared and own copies of a task can share a name.
    const label = `${getTaskTitle(task)}${task.shared ? " (server)" : ""}`

    return (
        <Flex flexWrap="wrap" alignItems="center" gap="2">
            <Input
                size="sm"
                value={task.name}
                minW="40"
                flex="1"
                maxLength={60}
                aria-label={`Name of ${label}`}
                onChange={handleNameChange}
            />

            <Input
                size="sm"
                value={task.subtitle ?? ""}
                placeholder="Subtitle"
                minW="32"
                flex="1"
                maxLength={60}
                aria-label={`Subtitle of ${label}`}
                onChange={handleSubtitleChange}
            />

            <WholeNumberInput
                size="sm"
                value={String(task.cap)}
                w="16"
                textAlign="center"
                aria-label={`Cap of ${label}`}
                onChange={handleCapChange}
            />

            <TaskResetSelect
                value={task.reset}
                label={`Reset of ${label}`}
                onChange={handleResetChange}
            />

            <TaskSharedToggle
                checked={task.shared}
                label={`Shared by server: ${label}`}
                onChange={handleSharedChange}
            />

            <MoveButtons
                first={first}
                last={last}
                label={label}
                onMove={handleMove}
            />

            <ConfirmButton
                variant="dangerGhost"
                size="xs"
                aria-label={`Remove ${label}`}
                confirmLabel="Remove"
                onConfirm={handleDelete}
            >
                <LuTrash2 />
            </ConfirmButton>
        </Flex>
    )
}
