import { Button, Flex, Input, Text } from "@chakra-ui/react"
import { DEFAULT_CLASS_ID, type ClassId } from "@config/classPresets/classInfo"
import { ServerSelect } from "@timers/bosses/ServerSelect"
import { useTimerSettings } from "@timers/hooks/useTimerSettings"
import type { CharacterFields } from "@tracker/logic/trackerEdits"
import { useState, type ChangeEvent, type FormEvent } from "react"
import { LuPlus } from "react-icons/lu"
import { CharacterClassSelect } from "./CharacterClassSelect"

type AddCharacterFormProps = {
    onCreate: (fields: CharacterFields) => void
}

export const AddCharacterForm = ({ onCreate }: AddCharacterFormProps) => {
    const { settings } = useTimerSettings()

    const [name, setName] = useState("")
    const [classId, setClassId] = useState<ClassId>(DEFAULT_CLASS_ID)
    // Starts on the Timers page's server; kept for the next character.
    const [server, setServer] = useState(settings.server)

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value)
    }

    const handleSubmit = (event: FormEvent<HTMLDivElement>) => {
        event.preventDefault()

        if (!name.trim()) {
            return
        }

        onCreate({ name: name, classId: classId, server: server })
        setName("")
    }

    return (
        <Flex
            as="form"
            p="3"
            flexDir="column"
            gap="2"
            layerStyle="inset"
            borderRadius="md"
            onSubmit={handleSubmit}
        >
            <Text textStyle="label">Add a character</Text>

            <Flex flexWrap="wrap" alignItems="center" gap="2">
                <Input
                    size="sm"
                    value={name}
                    minW="32"
                    flex="1"
                    maxLength={40}
                    placeholder="Name"
                    aria-label="New character name"
                    onChange={handleNameChange}
                />

                <CharacterClassSelect
                    value={classId}
                    label="New character class"
                    onChange={setClassId}
                />

                <ServerSelect
                    value={server}
                    label="New character server"
                    onChange={setServer}
                />

                <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={!name.trim()}
                >
                    <LuPlus />
                    Add
                </Button>
            </Flex>
        </Flex>
    )
}
