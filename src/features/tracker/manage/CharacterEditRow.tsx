import { Flex, Input } from "@chakra-ui/react"
import { ConfirmButton } from "@common/ConfirmButton"
import { IconImage } from "@common/IconImage"
import { MoveButtons } from "@common/MoveButtons"
import { CLASS_ICONS, type ClassId } from "@config/classPresets/classInfo"
import { ServerSelect } from "@timers/bosses/ServerSelect"
import { getCharacterName } from "@tracker/logic/characterName"
import type { CharacterFields } from "@tracker/logic/trackerEdits"
import type { TrackerCharacter } from "@tracker/types"
import type { ChangeEvent } from "react"
import { LuTrash2 } from "react-icons/lu"
import { CharacterClassSelect } from "./CharacterClassSelect"

type CharacterEditRowProps = {
    character: TrackerCharacter
    first: boolean
    last: boolean
    onChange: (id: string, changes: Partial<CharacterFields>) => void
    onDelete: (id: string) => void
    onMove: (id: string, offset: -1 | 1) => void
}

export const CharacterEditRow = ({
    character,
    first,
    last,
    onChange,
    onDelete,
    onMove,
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

    const handleMove = (offset: -1 | 1) => {
        onMove(character.id, offset)
    }

    const handleDelete = () => {
        onDelete(character.id)
    }

    const name = getCharacterName(character)

    return (
        <Flex flexWrap="wrap" alignItems="center" gap="2">
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

            <MoveButtons
                first={first}
                last={last}
                label={name}
                onMove={handleMove}
            />

            <ConfirmButton
                variant="dangerGhost"
                size="xs"
                aria-label={`Remove ${name}`}
                confirmLabel="Remove"
                onConfirm={handleDelete}
            >
                <LuTrash2 />
            </ConfirmButton>
        </Flex>
    )
}
