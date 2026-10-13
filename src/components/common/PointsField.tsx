import { Field, Input } from "@chakra-ui/react"
import type { ChangeEvent } from "react"

type PointsFieldProps = {
    value: number
    label: string
    disabled?: boolean
    onChange: (value: number) => void
}

// A whole, non-negative number of points.
export const PointsField = ({
    value,
    label,
    disabled,
    onChange,
}: PointsFieldProps) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = Number(event.target.value)

        onChange(Number.isFinite(next) ? Math.max(0, Math.floor(next)) : 0)
    }

    return (
        <Field.Root orientation="horizontal" gap="3">
            <Field.Label fontSize="sm">{label}</Field.Label>

            <Input
                size="sm"
                min={0}
                value={value}
                w="24"
                textAlign="right"
                type="number"
                disabled={disabled}
                onChange={handleChange}
            />
        </Field.Root>
    )
}
