import { Input, type InputProps } from "@chakra-ui/react"
import type { FocusEvent } from "react"
import { LIMIT_COLUMN_WIDTH } from "./abilityColumns"

// Select the whole value on focus so typing replaces it. Re-select on the
// next frame because a mouse click can clear the selection on mouseup.
const selectAllOnFocus = (event: FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget

    input.select()
    requestAnimationFrame(() => input.select())
}

export const LimitInput = ({ ...props }: InputProps) => {
    return (
        <Input
            size="sm"
            w={LIMIT_COLUMN_WIDTH}
            textAlign="center"
            type="number"
            onFocus={selectAllOnFocus}
            {...props}
        />
    )
}
