import { Input } from "@chakra-ui/react"
import { HOVER_REVEAL } from "@common/hoverReveal"
import { ConfirmButton } from "@common/ConfirmButton"
import { IconImage } from "@common/IconImage"
import { CLASS_ICONS, type ClassId } from "@config/classPresets/classInfo"
import { ServerSelect } from "@timers/bosses/ServerSelect"
import { getCharacterName } from "@tracker/logic/characterName"
import type { CharacterFields } from "@tracker/logic/trackerEdits"
import type { TrackerCharacter } from "@tracker/types"
import type { ChangeEvent } from "react"
import { LuTrash2 } from "react-icons/lu"
import { CharacterClassSelect } from "./CharacterClassSelect"
import { SortableRow } from "./SortableRow"

type CharacterEditRowProps = {
    character: TrackerCharacter
    index: number
    onChange: (id: string, changes: Partial<CharacterFields>) => void
    onDelete: (id: string) => void
}

export const CharacterEditRow = ({
    character,
    index,
    onChange,
    onDelete,
}: CharacterEditRowProps) => {
    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(character.id, { name: event.target.value })
    }

    const handleClassChange = (classId: ClassId) => {
        onChange(character.id, { classId: classId })
    }

    const handleServerChange = (server: string) => {
        onChange(character.id, { server: server })
    }

    const handleDelete = () => {
        onDelete(character.id)
    }

    const name = getCharacterName(character)

    return (
        <SortableRow id={character.id} index={index} label={name}>
            <IconImage icon={CLASS_ICONS[character.classId]} />

            <Input
                size="sm"
                value={character.name}
                minW="32"
                flex="1"
                maxLength={40}
                aria-label={`Name of ${name}`}
                onChange={handleNameChange}
            />

            <CharacterClassSelect
                value={character.classId}
                label={`Class of ${name}`}
                onChange={handleClassChange}
            />

            <ServerSelect
                value={character.server}
                label={`Server of ${name}`}
                onChange={handleServerChange}
            />

            <ConfirmButton
                variant="dangerGhost"
                size="xs"
                // Shown on the row's hover where the device can hover; its
                // Remove / Cancel step stays visible.
                _canHover={HOVER_REVEAL}
                aria-label={`Remove ${name}`}
                confirmLabel="Remove"
                onConfirm={handleDelete}
            >
                <LuTrash2 />
            </ConfirmButton>
        </SortableRow>
    )
}
