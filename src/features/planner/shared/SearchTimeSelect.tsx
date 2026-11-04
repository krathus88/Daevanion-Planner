import { NativeSelect } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import { formatSearchTime, STALL_OPTIONS } from "@planner/config/searchTime"

type SearchTimeSelectProps = {
    // Seconds without a better result before the search stops.
    value: number
    size?: "sm" | "md"
    onChange: (seconds: number) => void
}

export const SearchTimeSelect = ({
    value,
    size = "md",
    onChange,
}: SearchTimeSelectProps) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(Number(event.target.value))
    }

    return (
        <NativeSelect.Root size={size} w="searchTimeSelect" flexShrink="0">
            <NativeSelect.Field
                value={value}
                title="The search stops once this long passes without finding anything better"
                aria-label="Stop after no improvement for"
                onChange={handleChange}
            >
                {STALL_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                        {formatSearchTime(seconds)}
                    </option>
                ))}
            </NativeSelect.Field>

            <NativeSelect.Indicator />
        </NativeSelect.Root>
    )
}
