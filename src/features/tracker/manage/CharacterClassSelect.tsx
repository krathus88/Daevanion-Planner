import { NativeSelect } from "@chakra-ui/react"
import {
    CLASS_IDS,
    CLASS_NAMES,
    isClassId,
    type ClassId,
} from "@config/classPresets/classInfo"
import type { ChangeEvent } from "react"

type CharacterClassSelectProps = {
    value: ClassId
    label: string
    onChange: (classId: ClassId) => void
}

export const CharacterClassSelect = ({
    value,
    label,
    onChange,
}: CharacterClassSelectProps) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        if (isClassId(event.target.value)) {
            onChange(event.target.value)
        }
    }

    return (
        <NativeSelect.Root size="sm" w="36" flexShrink="0">
            <NativeSelect.Field
                value={value}
                aria-label={label}
                onChange={handleChange}
            >
                {CLASS_IDS.map((classId) => (
                    <option key={classId} value={classId}>
                        {CLASS_NAMES[classId]}
                    </option>
                ))}
            </NativeSelect.Field>

            <NativeSelect.Indicator />
        </NativeSelect.Root>
    )
}
