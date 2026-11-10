import { Button, Flex, Input, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import type { TaskFields } from "@tracker/logic/trackerEdits"
import type { TrackerReset } from "@tracker/types"
import { useState, type ChangeEvent, type FormEvent } from "react"
import { LuPlus } from "react-icons/lu"
import { TaskResetSelect } from "./TaskResetSelect"
import { TaskSharedToggle } from "./TaskSharedToggle"

type AddTaskFormProps = {
    onCreate: (fields: TaskFields) => void
}

export const AddTaskForm = ({ onCreate }: AddTaskFormProps) => {
    const [name, setName] = useState("")
    const [reset, setReset] = useState<TrackerReset>("daily")
    const [cap, setCap] = useState("1")
    const [shared, setShared] = useState(false)

    const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value)
    }

    const handleCapChange = (event: ChangeEvent<HTMLInputElement>) => {
        setCap(event.target.value)
    }

    const handleSubmit = (event: FormEvent<HTMLDivElement>) => {
        event.preventDefault()

        if (!name.trim()) {
            return
        }

        onCreate({
            name: name,
            reset: reset,
            cap: Number(cap || "1"),
            shared: shared,
        })
        setName("")
        setCap("1")
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
            <Text textStyle="label">Add a task</Text>

            <Flex flexWrap="wrap" alignItems="center" gap="2">
                <Input
                    size="sm"
                    value={name}
                    minW="40"
                    flex="1"
                    maxLength={60}
                    placeholder="Name"
                    aria-label="New task name"
                    onChange={handleNameChange}
                />

                <WholeNumberInput
                    size="sm"
                    value={cap}
                    fallback={1}
                    w="16"
                    textAlign="center"
                    aria-label="New task cap"
                    onChange={handleCapChange}
                />

                <TaskResetSelect
                    value={reset}
                    label="New task reset"
                    onChange={setReset}
                />

                <TaskSharedToggle
                    checked={shared}
                    label="New task shared by server"
                    onChange={setShared}
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
