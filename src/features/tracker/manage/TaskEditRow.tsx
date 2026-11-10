import { Box, Input } from "@chakra-ui/react"
import { HOVER_REVEAL } from "@common/hoverReveal"
import { ConfirmButton } from "@common/ConfirmButton"
import { IconImage } from "@common/IconImage"
import { WholeNumberInput } from "@common/WholeNumberInput"
import { getTaskIcon } from "@tracker/config/taskIcons"
import { getTaskTitle } from "@tracker/logic/taskTitle"
import type { TaskFields } from "@tracker/logic/trackerEdits"
import type { TrackerReset, TrackerTask } from "@tracker/types"
import type { ChangeEvent } from "react"
import { LuTrash2 } from "react-icons/lu"
import { SortableRow } from "./SortableRow"
import { TaskResetSelect } from "./TaskResetSelect"
import { TaskSharedToggle } from "./TaskSharedToggle"

type TaskEditRowProps = {
    task: TrackerTask
    index: number
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
}

export const TaskEditRow = ({
    task,
    index,
    onChange,
    onDelete,
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

    const handleDelete = () => {
        onDelete(task.id)
    }

    const icon = getTaskIcon(task.id)
    // Shared and own copies of a task can share a name.
    const label = `${getTaskTitle(task)}${task.shared ? " (server)" : ""}`

    return (
        <SortableRow id={task.id} index={index} label={label}>
            {icon ? (
                <IconImage icon={icon} />
            ) : (
                // Keeps names lined up with the presets' beside an icon.
                <Box boxSize="5" flexShrink="0" />
            )}

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
                fallback={1}
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

            <ConfirmButton
                variant="dangerGhost"
                size="xs"
                // Shown on the row's hover where the device can hover; its
                // Remove / Cancel step stays visible.
                _canHover={HOVER_REVEAL}
                aria-label={`Remove ${label}`}
                confirmLabel="Remove"
                onConfirm={handleDelete}
            >
                <LuTrash2 />
            </ConfirmButton>
        </SortableRow>
    )
}
