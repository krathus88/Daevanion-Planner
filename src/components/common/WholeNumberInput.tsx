import { Input, type InputProps } from "@chakra-ui/react"
import type { ChangeEvent, FocusEvent } from "react"

// Select the whole value on focus so typing replaces it. Re-select on the
// next frame because a mouse click can clear the selection on mouseup.
const selectAllOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget

    input.select()
    requestAnimationFrame(() => input.select())
}

// A field for a whole number. It's a text field with a numeric keyboard, not
// type="number": React then always shows the parsed value, so typing over a
// 0 gives "5" rather than "05". Anything but digits is dropped as you type.
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
