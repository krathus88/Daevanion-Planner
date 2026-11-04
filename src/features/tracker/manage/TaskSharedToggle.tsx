import { Checkbox } from "@chakra-ui/react"
import { Tooltip } from "@ui/tooltip"

type TaskSharedToggleProps = {
    checked: boolean
    label: string
    onChange: (shared: boolean) => void
}

export const TaskSharedToggle = ({
    checked,
    label,
    onChange,
}: TaskSharedToggleProps) => {
    const handleCheckedChange = (details: Checkbox.CheckedChangeDetails) => {
        onChange(details.checked === true)
    }

    return (
        <Tooltip
            content="One count for all characters on the same server"
            openDelay={300}
        >
            <Checkbox.Root
                size="sm"
                checked={checked}
                flexShrink="0"
                aria-label={label}
                onCheckedChange={handleCheckedChange}
            >
                <Checkbox.HiddenInput />

                <Checkbox.Control />

                <Checkbox.Label fontWeight="normal">Server</Checkbox.Label>
            </Checkbox.Root>
        </Tooltip>
    )
}
