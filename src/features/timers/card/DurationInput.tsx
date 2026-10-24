import { InputGroup, type InputProps } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import type { ChangeEvent } from "react"

type DurationInputProps = {
    value: number
    max: number
    unit: string
    compact?: boolean
    label: string
    onChange: (value: number) => void
}

// Any padding prop, even undefined, replaces InputGroup's unit padding.
const COMPACT_PADDING: InputProps = { ps: "2", pe: "5" }

// The unit passes clicks through to the input.
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
