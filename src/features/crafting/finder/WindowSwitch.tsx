import { SegmentGroup } from "@chakra-ui/react"
import type { CraftingWindow } from "@crafting/logic/recipeList"

const ITEMS = [
    { value: "crafting", label: "Crafting" },
    { value: "transfer", label: "Transfer Crafting" },
]

type WindowSwitchProps = {
    value: CraftingWindow
    onChange: (value: CraftingWindow) => void
}

// The game's Crafting | Transfer Crafting windows.
export const WindowSwitch = ({ value, onChange }: WindowSwitchProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        onChange(details.value === "transfer" ? "transfer" : "crafting")
    }

    return (
        <SegmentGroup.Root
            size="xs"
            layout="fill"
            value={value}
            aria-label="Crafting window"
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            <SegmentGroup.Items items={ITEMS} />
        </SegmentGroup.Root>
    )
}
