import type { Tokens } from "@chakra-ui/react"
import { SegmentGroup } from "@chakra-ui/react"
import { WANTS, type Want } from "@planner/logic/boardWants"

const WANT_NAMES: Record<Want, string> = {
    need: "Need",
    prefer: "Prefer",
    skip: "Skip",
}

const WANT_COLORS: Record<Want, Tokens["colors"]> = {
    need: "app.info",
    prefer: "app.success",
    skip: "app.subtle",
}

type WantPickerProps = {
    value: Want
    label: string
    onChange: (want: Want) => void
}

export const WantPicker = ({ value, label, onChange }: WantPickerProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        onChange(details.value as Want)
    }

    return (
        <SegmentGroup.Root
            layout="compact"
            value={value}
            flexShrink="0"
            aria-label={label}
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            {WANTS.map((want) => (
                <SegmentGroup.Item
                    key={want}
                    value={want}
                    color="app.subtle"
                    _checked={{ color: WANT_COLORS[want] }}
                    _hover={{ color: WANT_COLORS[want] }}
                >
                    <SegmentGroup.ItemText>
                        {WANT_NAMES[want]}
                    </SegmentGroup.ItemText>

                    <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
            ))}
        </SegmentGroup.Root>
    )
}
