import { InputGroup, type InputProps } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import type { ChangeEvent } from "react"

type DurationInputProps = {
    value: number
    max: number
    unit: string
    // Just wide enough for two digits and a one-letter unit, so a row of
    // them fits beside its buttons.
    compact?: boolean
    label: string
    onChange: (value: number) => void
}

// Only set when compact: InputGroup pads the input for its unit, and any
// padding prop passed here, even undefined, replaces that.
const COMPACT_PADDING: InputProps = { ps: "2", pe: "5" }

// A whole number between 0 and max, with its unit after it. The unit lets
// clicks through, so clicking anywhere in the box focuses the number.
export const DurationInput = ({
    value,
    max,
    unit,
    compact,
    label,
    onChange,
}: DurationInputProps) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = Math.floor(Number(event.target.value))

        onChange(Number.isFinite(next) ? Math.min(max, Math.max(0, next)) : 0)
    }

    return (
        <InputGroup
            w={compact ? "12" : "20"}
            endElement={unit}
            endElementProps={
                compact
                    ? { pointerEvents: "none", minW: "0", pe: "1.5" }
                    : { pointerEvents: "none" }
            }
        >
            <WholeNumberInput
                size="sm"
                value={value}
                textAlign="right"
                {...(compact ? COMPACT_PADDING : {})}
                aria-label={label}
                onChange={handleChange}
            />
        </InputGroup>
    )
}
