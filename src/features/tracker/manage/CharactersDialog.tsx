import { CloseButton, Dialog, Flex, Portal, Text } from "@chakra-ui/react"
import type { CharacterFields } from "@tracker/logic/trackerEdits"
import type { TrackerCharacter } from "@tracker/types"
import { AddCharacterForm } from "./AddCharacterForm"
import { CharacterEditRow } from "./CharacterEditRow"

type CharactersDialogProps = {
    characters: TrackerCharacter[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (fields: CharacterFields) => void
    onChange: (id: string, changes: Partial<CharacterFields>) => void
    onDelete: (id: string) => void
    onMove: (id: string, offset: -1 | 1) => void
}

export const CharactersDialog = ({
    characters,
    open,
    onOpenChange,
    onCreate,
    onChange,
    onDelete,
    onMove,
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
                                        {characters.map((character, index) => (
                                            <CharacterEditRow
                                                key={character.id}
                                                character={character}
                                                first={index === 0}
                                                last={
                                                    index ===
                                                    characters.length - 1
                                                }
                                                onChange={onChange}
                                                onDelete={onDelete}
                                                onMove={onMove}
                                            />
                                        ))}
                                    </Flex>
                                ) : (
                                    <Text textStyle="hint">
                                        Each character gets its own column in
                                        the tracker.
                                    </Text>
                                )}

                                <AddCharacterForm onCreate={onCreate} />
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
