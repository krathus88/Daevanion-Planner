import { SegmentGroup } from "@chakra-ui/react"
import type { MaterialScope } from "@crafting/logic/materialOrder"

const ITEMS = [
    { value: "craft", label: "This craft" },
    { value: "chain", label: "Whole chain" },
]

type MaterialScopeSwitchProps = {
    value: MaterialScope
    onChange: (value: MaterialScope) => void
}

// All materials: the main craft's own, or every craft's down the chain.
export const MaterialScopeSwitch = ({
    value,
    onChange,
}: MaterialScopeSwitchProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        onChange(details.value === "chain" ? "chain" : "craft")
    }

    return (
        <SegmentGroup.Root
            size="xs"
            alignSelf="flex-start"
            value={value}
            aria-label="Materials of"
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            <SegmentGroup.Items items={ITEMS} />
        </SegmentGroup.Root>
    )
}
