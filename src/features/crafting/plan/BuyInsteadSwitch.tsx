import { Switch } from "@chakra-ui/react"

type BuyInsteadSwitchProps = {
    checked: boolean
    onChange: (checked: boolean) => void
}

export const BuyInsteadSwitch = ({
    checked,
    onChange,
}: BuyInsteadSwitchProps) => {
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

            <Switch.Label fontSize="xs">Buy instead</Switch.Label>
        </Switch.Root>
    )
}
