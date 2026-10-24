import { Input, type InputProps } from "@chakra-ui/react"
import type { ChangeEvent, FocusEvent } from "react"

// Re-select next frame; a mouse click can clear the selection on mouseup.
const selectAllOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget

    input.select()
    requestAnimationFrame(() => input.select())
}

// Text field, not type="number", so typing over a 0 gives "5", not "05".
export const WholeNumberInput = ({ onChange, ...props }: InputProps) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const digits = event.target.value.replace(/\D/g, "")

        if (digits !== event.target.value) {
            event.target.value = digits
        }

        onChange?.(event)
    }

    return (
        <Input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            onFocus={selectAllOnFocus}
            onChange={handleChange}
            {...props}
        />
    )
}
