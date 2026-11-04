import { CloseButton, Dialog, Flex, Portal, Text } from "@chakra-ui/react"
import { ConfirmButton } from "@common/ConfirmButton"
import type { TaskSection } from "@tracker/logic/taskSections"
import type { TaskFields } from "@tracker/logic/trackerEdits"
import { LuRotateCcw } from "react-icons/lu"
import { AddTaskForm } from "./AddTaskForm"
import { TaskEditSection } from "./TaskEditSection"

type TasksDialogProps = {
    sections: TaskSection[]
    open: boolean
    usesStarterTasks: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (fields: TaskFields) => void
    onChange: (id: string, fields: TaskFields) => void
    onDelete: (id: string) => void
    onMove: (id: string, offset: -1 | 1) => void
    onRestore: () => void
}

export const TasksDialog = ({
    sections,
    open,
    usesStarterTasks,
    onOpenChange,
    onCreate,
    onChange,
    onDelete,
    onMove,
    onRestore,
}: TasksDialogProps) => {
    const handleOpenChange = (details: Dialog.OpenChangeDetails) => {
        onOpenChange(details.open)
    }

    return (
        <Dialog.Root
            size="lg"
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
                                {sections.map((section) => (
                                    <TaskEditSection
                                        key={section.reset}
                                        section={section}
                                        onChange={onChange}
                                        onDelete={onDelete}
                                        onMove={onMove}
                                    />
                                ))}

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
