import { Checkbox } from "@chakra-ui/react"
import { BOUGHT_SOULS } from "@pets/logic/petLevels"

type ShopBoughtToggleProps = {
    petId: number
    checked: boolean
    onChange: (petId: number, bought: boolean) => void
}

export const ShopBoughtToggle = ({
    petId,
    checked,
    onChange,
}: ShopBoughtToggleProps) => {
    const handleCheckedChange = (details: Checkbox.CheckedChangeDetails) => {
        onChange(petId, details.checked === true)
    }

    return (
        <Checkbox.Root
            size="sm"
            checked={checked}
            onCheckedChange={handleCheckedChange}
        >
            <Checkbox.HiddenInput />

            <Checkbox.Control />

            <Checkbox.Label fontWeight="normal">
                Bought (+{BOUGHT_SOULS})
            </Checkbox.Label>
        </Checkbox.Root>
    )
}
