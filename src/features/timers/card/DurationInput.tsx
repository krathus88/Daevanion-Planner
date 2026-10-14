import { InputGroup } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import type { ChangeEvent } from "react"

type DurationInputProps = {
    value: number
    max: number
    unit: string
    label: string
    onChange: (value: number) => void
}

// A whole number between 0 and max, with its unit after it. The unit lets
// clicks through, so clicking anywhere in the box focuses the number.
export const DurationInput = ({
    value,
    max,
    unit,
    label,
    onChange,
}: DurationInputProps) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = Math.floor(Number(event.target.value))

        onChange(Number.isFinite(next) ? Math.min(max, Math.max(0, next)) : 0)
    }

    return (
        <InputGroup
            w="20"
            endElement={unit}
            endElementProps={{ pointerEvents: "none" }}
        >
            <WholeNumberInput
                size="sm"
                value={value}
                textAlign="right"
                aria-label={label}
                onChange={handleChange}
            />
        </InputGroup>
    )
}
