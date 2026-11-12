import { CompanionLocked } from "@account/CompanionLocked"
import { useCompanionLocked } from "@account/companionLockedContext"
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
    // The companion app reads the souls from the game instead.
    const locked = useCompanionLocked()

    const handleCheckedChange = (details: Checkbox.CheckedChangeDetails) => {
        onChange(petId, details.checked === true)
    }

    return (
        <CompanionLocked locked={locked}>
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
        </CompanionLocked>
    )
}
