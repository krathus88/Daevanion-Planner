import { Switch } from "@chakra-ui/react"

type SharedTimersSwitchProps = {
    checked: boolean
    onChange: (checked: boolean) => void
}

export const SharedTimersSwitch = ({
    checked,
    onChange,
}: SharedTimersSwitchProps) => {
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

            <Switch.Label>Shared boss timers</Switch.Label>
        </Switch.Root>
    )
}
