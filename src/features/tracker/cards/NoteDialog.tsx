import {
    Button,
    CloseButton,
    Dialog,
    Field,
    Flex,
    Input,
    Portal,
    Textarea,
} from "@chakra-ui/react"
import { MAX_LONG_NOTE, MAX_SHORT_NOTE } from "@tracker/storage/trackerData"
import type { CharacterNote } from "@tracker/types"
import { useState, type ChangeEvent } from "react"

type NoteDialogProps = {
    ownerLabel: string
    note: CharacterNote
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (note: CharacterNote) => void
}

type NoteFormProps = Omit<NoteDialogProps, "open">

// Mounted on each open, so the draft starts from the saved note.
const NoteForm = ({
    ownerLabel,
    note,
    onOpenChange,
    onSave,
}: NoteFormProps) => {
    const [draft, setDraft] = useState(note)

    const handleShortChange = (event: ChangeEvent<HTMLInputElement>) => {
        setDraft({ ...draft, short: event.target.value })
    }

    const handleLongChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setDraft({ ...draft, long: event.target.value })
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    const handleSave = () => {
        onSave(draft)
        onOpenChange(false)
    }

    return (
        <>
            <Dialog.Header>
                <Dialog.Title>Note for {ownerLabel}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
                <Flex flexDir="column" gap="4">
                    <Field.Root>
                        <Field.Label>Short</Field.Label>

                        <Input
                            size="sm"
                            value={draft.short}
                            maxLength={MAX_SHORT_NOTE}
                            placeholder="Shown on the card"
                            onChange={handleShortChange}
                        />
                    </Field.Root>

                    <Field.Root>
                        <Field.Label>Details</Field.Label>

                        <Textarea
                            size="sm"
                            value={draft.long}
                            rows={6}
                            maxLength={MAX_LONG_NOTE}
                            placeholder="Shown when hovering the note button"
                            autoresize
                            onChange={handleLongChange}
                        />
                    </Field.Root>
                </Flex>
            </Dialog.Body>

            <Dialog.Footer gap="2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                </Button>

                <Button variant="primary" size="sm" onClick={handleSave}>
                    Save
                </Button>
            </Dialog.Footer>
        </>
    )
}

// Edits a character's note: the short one shows on the card, the details on
// hover. Emptying both removes the note.
export const NoteDialog = ({
    open,
    onOpenChange,
    ...props
}: NoteDialogProps) => {
    const handleOpenChange = (details: Dialog.OpenChangeDetails) => {
        onOpenChange(details.open)
    }

    return (
        <Dialog.Root
            size="md"
            open={open}
            lazyMount
            unmountOnExit
            onOpenChange={handleOpenChange}
        >
            <Portal>
                <Dialog.Backdrop />

                <Dialog.Positioner>
                    <Dialog.Content bg="app.panel">
                        <NoteForm onOpenChange={onOpenChange} {...props} />

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
