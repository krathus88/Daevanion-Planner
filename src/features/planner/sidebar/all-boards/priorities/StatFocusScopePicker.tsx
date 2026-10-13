import { SegmentGroup } from "@chakra-ui/react"
import {
    FOCUS_SCOPE_NAMES,
    FOCUS_SCOPES,
    type FocusScope,
} from "@planner/config/stats"

const scopes = FOCUS_SCOPES.map((scope) => ({
    value: scope,
    label: FOCUS_SCOPE_NAMES[scope],
}))

type StatFocusScopePickerProps = {
    value: FocusScope
    onChange: (scope: FocusScope) => void
}

export const StatFocusScopePicker = ({
    value,
    onChange,
}: StatFocusScopePickerProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        onChange(details.value as FocusScope)
    }

    return (
        <SegmentGroup.Root
            layout="fill"
            value={value}
            aria-label="Abilities that wait behind stats"
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            <SegmentGroup.Items items={scopes} />
        </SegmentGroup.Root>
    )
}
