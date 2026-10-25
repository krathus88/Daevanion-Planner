import type { InputProps } from "@chakra-ui/react"
import { useState, type ChangeEvent, type KeyboardEvent } from "react"
import { LimitInput } from "./LimitInput"

type PriorityInputProps = Omit<InputProps, "value" | "onChange"> & {
    value: number
    onCommit: (value: number) => void
}

// Holds a draft until blur or Enter, so a sorted list doesn't reorder mid-typing.
export const PriorityInput = ({
    value,
    onCommit,
    ...props
}: PriorityInputProps) => {
    const [draft, setDraft] = useState<string | null>(null)

    const commit = () => {
        if (draft === null) return

        const next = Math.floor(Number(draft))

        setDraft(null)

        if (draft !== "" && next !== value) {
            onCommit(Math.min(99, Math.max(1, next)))
        }
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setDraft(event.target.value)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") commit()
        if (event.key === "Escape") setDraft(null)
    }

    return (
        <LimitInput
            max={99}
            min={1}
            value={draft ?? value}
            onChange={handleChange}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            {...props}
        />
    )
}
