import {
    Button,
    CloseButton,
    Dialog,
    Flex,
    Portal,
    Text,
} from "@chakra-ui/react"
import type { NewGameCharacter } from "@account/game/gameCharacters"
import { CLASS_NAMES } from "@config/classPresets/classInfo"
import { SERVERS } from "@timers/config/servers"
import { useState } from "react"

type NewCharacterDialogProps = {
    // Characters the companion app sent that the tracker lacks.
    characters: NewGameCharacter[]
    onAdd: (character: NewGameCharacter) => void
    onDecline: (character: NewGameCharacter) => void
}

// Asks, one character at a time, before adding a character the companion app
// sent. Closing it asks again on the next visit; "Don't add" never does.
export const NewCharacterDialog = ({
    characters,
    onAdd,
    onDecline,
}: NewCharacterDialogProps) => {
    // Asked about and closed on this visit.
    const [later, setLater] = useState<string[]>([])

    const character = characters.find((item) => !later.includes(item.key))

    if (character === undefined) {
        return null
    }

    const server =
        SERVERS.find((item) => item.id === character.server)?.name ??
        character.server

    const handleOpenChange = (details: Dialog.OpenChangeDetails) => {
        if (!details.open) {
            setLater([...later, character.key])
        }
    }

    const handleAdd = () => {
        onAdd(character)
    }

    const handleDecline = () => {
        onDecline(character)
    }

    return (
        <Dialog.Root size="sm" open onOpenChange={handleOpenChange}>
            <Portal>
                <Dialog.Backdrop />

                <Dialog.Positioner>
                    <Dialog.Content bg="app.panel">
                        <Dialog.Header>
                            <Dialog.Title>
                                New character from the game
                            </Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <Flex flexDir="column" gap="2">
                                <Text>
                                    The companion app saw{" "}
                                    <Text as="span" fontWeight="semibold">
                                        {character.name}
                                    </Text>{" "}
                                    ({CLASS_NAMES[character.classId]}, {server}
                                    ). Add it to the tracker?
                                </Text>

                                <Text textStyle="hint">
                                    Once added, its entries, Odyle Energy and
                                    more fill from the game.
                                </Text>
                            </Flex>
                        </Dialog.Body>

                        <Dialog.Footer gap="2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDecline}
                            >
                                Don&apos;t add
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAdd}
                            >
                                Add
                            </Button>
                        </Dialog.Footer>

                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}
