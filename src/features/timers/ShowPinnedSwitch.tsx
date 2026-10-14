import { Switch } from "@chakra-ui/react"

type ShowPinnedSwitchProps = {
    checked: boolean
    onChange: (checked: boolean) => void
}

export const ShowPinnedSwitch = ({
    checked,
    onChange,
}: ShowPinnedSwitchProps) => {
    const handleCheckedChange = (details: Switch.CheckedChangeDetails) => {
        onChange(details.checked)
    }

    return (
        <Switch.Root
            size="sm"
            checked={checked}
            onCheckedChange={handleCheckedChange}
        >
            <Switch.HiddenInput />

            <Switch.Control />

            <Switch.Label>Show pinned timers in the header</Switch.Label>
        </Switch.Root>
    )
}
