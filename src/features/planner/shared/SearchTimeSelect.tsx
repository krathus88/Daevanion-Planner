import { NativeSelect } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import {
    formatSearchTime,
    SEARCH_TIME_OPTIONS,
} from "@planner/config/searchTime"

type SearchTimeSelectProps = {
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
                title="How long to search for better routes"
                aria-label="Search time"
                onChange={handleChange}
            >
                {SEARCH_TIME_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                        {formatSearchTime(seconds)}
                    </option>
                ))}
            </NativeSelect.Field>

            <NativeSelect.Indicator />
        </NativeSelect.Root>
    )
}
