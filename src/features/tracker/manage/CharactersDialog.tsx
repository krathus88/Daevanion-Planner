import { CloseButton, Dialog, Flex, Portal, Text } from "@chakra-ui/react"
import type { CharacterFields } from "@tracker/logic/trackerEdits"
import type { TrackerCharacter } from "@tracker/types"
import { AddCharacterForm } from "./AddCharacterForm"
import { CharacterEditRow } from "./CharacterEditRow"
import { MembershipToggle } from "./MembershipToggle"
import { SortableList } from "./SortableList"

type CharactersDialogProps = {
    characters: TrackerCharacter[]
    membership: boolean
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (fields: CharacterFields) => void
    onChange: (id: string, changes: Partial<CharacterFields>) => void
    onDelete: (id: string) => void
    onMove: (id: string, targetId: string) => void
    onMembershipChange: (membership: boolean) => void
}

export const CharactersDialog = ({
    characters,
    membership,
    open,
    onOpenChange,
    onCreate,
    onChange,
    onDelete,
    onMove,
    onMembershipChange,
}: CharactersDialogProps) => {
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
                        <Dialog.Header>
                            <Dialog.Title>Characters</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <Flex flexDir="column" gap="4">
                                {characters.length > 0 ? (
                                    <Flex flexDir="column" gap="2">
                                        <SortableList
                                            ids={characters.map(
                                                (character) => character.id,
                                            )}
                                            onMove={onMove}
                                        >
                                            {characters.map(
                                                (character, index) => (
                                                    <CharacterEditRow
                                                        key={character.id}
                                                        character={character}
                                                        index={index}
                                                        onChange={onChange}
                                                        onDelete={onDelete}
                                                    />
                                                ),
                                            )}
                                        </SortableList>
                                    </Flex>
                                ) : (
                                    <Text textStyle="hint">
                                        Each character gets its own column in
                                        the tracker.
                                    </Text>
                                )}

                                <AddCharacterForm onCreate={onCreate} />

                                <MembershipToggle
                                    checked={membership}
                                    onChange={onMembershipChange}
                                />
                            </Flex>
                        </Dialog.Body>

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
