import { NativeSelect } from "@chakra-ui/react"
import { isTrackerReset, TRACKER_RESETS } from "@tracker/config/trackerResets"
import type { TrackerReset } from "@tracker/types"
import type { ChangeEvent } from "react"

type TaskResetSelectProps = {
    value: TrackerReset
    label: string
    onChange: (reset: TrackerReset) => void
}

export const TaskResetSelect = ({
    value,
    label,
    onChange,
}: TaskResetSelectProps) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        if (isTrackerReset(event.target.value)) {
            onChange(event.target.value)
        }
    }

    return (
        <NativeSelect.Root size="sm" w="28" flexShrink="0">
            <NativeSelect.Field
                value={value}
                aria-label={label}
                onChange={handleChange}
            >
                {TRACKER_RESETS.map((reset) => (
                    <option key={reset.id} value={reset.id}>
                        {reset.label}
                    </option>
                ))}
            </NativeSelect.Field>

            <NativeSelect.Indicator />
        </NativeSelect.Root>
    )
}
