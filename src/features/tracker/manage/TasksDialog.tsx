import { CloseButton, Dialog, Flex, Portal, Text } from "@chakra-ui/react"
import { ConfirmButton } from "@common/ConfirmButton"
import { getTaskEditGroups } from "@tracker/logic/taskEditGroups"
import type { TaskSection } from "@tracker/logic/taskSections"
import type { TaskFields } from "@tracker/logic/trackerEdits"
import type { TrackerTask } from "@tracker/types"
import { LuRotateCcw } from "react-icons/lu"
import { AddTaskForm } from "./AddTaskForm"
import { RemovedPresets } from "./RemovedPresets"
import { TaskEditGroup } from "./TaskEditGroup"

type TasksDialogProps = {
    sections: TaskSection[]
    open: boolean
    usesStarterTasks: boolean
    // Starter tasks removed from the user's own list.
    removedPresets: readonly TrackerTask[]
    onOpenChange: (open: boolean) => void
    onCreate: (fields: TaskFields) => void
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
    onMove: (id: string, targetId: string) => void
    onRestore: () => void
    onPresetRestore: (id: string) => void
}

export const TasksDialog = ({
    sections,
    open,
    usesStarterTasks,
    removedPresets,
    onOpenChange,
    onCreate,
    onChange,
    onDelete,
    onMove,
    onRestore,
    onPresetRestore,
}: TasksDialogProps) => {
    const handleOpenChange = (details: Dialog.OpenChangeDetails) => {
        onOpenChange(details.open)
    }

    const groups = getTaskEditGroups(sections)

    return (
        <Dialog.Root
            size="xl"
            open={open}
            scrollBehavior="inside"
            onOpenChange={handleOpenChange}
        >
            <Portal>
                <Dialog.Backdrop />

                <Dialog.Positioner>
                    <Dialog.Content bg="app.panel">
                        <Dialog.Header flexDir="column" gap="1">
                            <Dialog.Title>Tasks</Dialog.Title>

                            <Text textStyle="hint">
                                {usesStarterTasks
                                    ? "The starter list, with caps from community guides. Any edit gives you your own copy."
                                    : "Your own list. A cap of 1 is a checkbox, higher caps are counters."}
                            </Text>
                        </Dialog.Header>

                        <Dialog.Body>
                            <Flex flexDir="column" gap="5">
                                {groups.map((group) => (
                                    <TaskEditGroup
                                        key={group.id}
                                        group={group}
                                        onChange={onChange}
                                        onDelete={onDelete}
                                        onMove={onMove}
                                    />
                                ))}

                                {removedPresets.length > 0 && (
                                    <RemovedPresets
                                        presets={removedPresets}
                                        onRestore={onPresetRestore}
                                    />
                                )}

                                <AddTaskForm onCreate={onCreate} />
                            </Flex>
                        </Dialog.Body>

                        {!usesStarterTasks && (
                            <Dialog.Footer justifyContent="flex-start">
                                <ConfirmButton
                                    variant="ghost"
                                    size="xs"
                                    confirmLabel="Replace my tasks"
                                    onConfirm={onRestore}
                                >
                                    <LuRotateCcw />
                                    Restore the starter list
                                </ConfirmButton>
                            </Dialog.Footer>
                        )}

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
