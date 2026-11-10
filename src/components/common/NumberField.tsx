import { Field } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import { WholeNumberInput } from "./WholeNumberInput"

type NumberFieldProps = {
    // Null shows an empty field.
    value: number | null
    label: string
    // What an emptied field reports once left; null keeps it empty.
    fallback?: number | null
    min?: number
    max?: number
    placeholder?: string
    onChange: (value: number | null) => void
}

// A small whole-number field with its label above it.
export const NumberField = ({
    value,
    label,
    fallback = 0,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    placeholder,
    onChange,
}: NumberFieldProps) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value

        if (text === "") {
            onChange(fallback)

            return
        }

        onChange(Math.min(max, Math.max(min, Number(text))))
    }

    return (
        <Field.Root minW="0" gap="0.5">
            <Field.Label textStyle="caption">{label}</Field.Label>

            <WholeNumberInput
                size="xs"
                fallback={fallback}
                value={value ?? ""}
                textAlign="right"
                placeholder={placeholder}
                onChange={handleChange}
            />
        </Field.Root>
    )
}
