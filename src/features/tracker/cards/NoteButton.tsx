import { chakra, IconButton } from "@chakra-ui/react"
import type { CharacterNote } from "@tracker/types"
import { Tooltip } from "@ui/tooltip"
import { useState, type MouseEvent } from "react"
import { LuNotebookPen } from "react-icons/lu"
import { NoteDialog } from "./NoteDialog"

type NoteButtonProps = {
    ownerLabel: string
    note?: CharacterNote
    onSave: (note: CharacterNote) => void
}

const EMPTY_NOTE: CharacterNote = { short: "", long: "" }

// Beside a character's name: hovering shows the note's details (or its short
// line), clicking opens the editor. Brighter once there's a note.
export const NoteButton = ({ ownerLabel, note, onSave }: NoteButtonProps) => {
    const [open, setOpen] = useState(false)

    const handleClick = () => {
        setOpen(true)
    }

    // Clicks here, the dialog's included (React bubbles them out of its
    // portal), aren't clicks on the header, which would minimize the card.
    const stopClick = (event: MouseEvent<HTMLElement>) => {
        event.stopPropagation()
    }

    const hint = note ? note.long || note.short : "Add a note"

    return (
        <chakra.span display="contents" onClick={stopClick}>
            <Tooltip
                content={hint}
                openDelay={300}
                contentProps={{ maxW: "xs", whiteSpace: "pre-wrap" }}
            >
                <IconButton
                    variant="ghost"
                    size="2xs"
                    flexShrink="0"
                    color={note ? "app.fg" : "app.subtle"}
                    aria-label={`Note for ${ownerLabel}`}
                    onClick={handleClick}
                >
                    <LuNotebookPen />
                </IconButton>
            </Tooltip>

            <NoteDialog
                ownerLabel={ownerLabel}
                note={note ?? EMPTY_NOTE}
                open={open}
                onOpenChange={setOpen}
                onSave={onSave}
            />
        </chakra.span>
    )
}
