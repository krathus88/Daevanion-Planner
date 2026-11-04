import { Checkbox } from "@chakra-ui/react"
import type { TrackerTask } from "@tracker/types"
import { TaskName } from "./TaskName"

type TaskCheckRowProps = {
    task: TrackerTask
    checked: boolean
    // Checked and counting: an ignored task stays unmarked even when ticked.
    done: boolean
    ignored: boolean
    label: string
    onChange: (count: number) => void
}

// The whole row toggles, not just the box.
export const TaskCheckRow = ({
    task,
    checked,
    done,
    ignored,
    label,
    onChange,
}: TaskCheckRowProps) => {
    const handleCheckedChange = (details: Checkbox.CheckedChangeDetails) => {
        onChange(details.checked === true ? 1 : 0)
    }

    return (
        <Checkbox.Root
            colorPalette="green"
            checked={checked}
            px="2"
            py="1.5"
            minW="0"
            minH="10"
            flex="1"
            justifyContent="space-between"
            gap="3"
            borderRadius="md"
            cursor="button"
            _hover={{ bg: done ? undefined : "app.hover" }}
            onCheckedChange={handleCheckedChange}
        >
            <Checkbox.HiddenInput />

            {/* The input is named by this label, so it says whose task it is. */}
            <Checkbox.Label
                minW="0"
                flex="1"
                fontWeight="normal"
                aria-label={label}
            >
                <TaskName task={task} done={done} ignored={ignored} />
            </Checkbox.Label>

            <Checkbox.Control />
        </Checkbox.Root>
    )
}
