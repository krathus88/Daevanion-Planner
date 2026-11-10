import { NativeSelect } from "@chakra-ui/react"
import {
    isProfessionId,
    PROFESSION_IDS,
    PROFESSION_NAMES,
    type ProfessionId,
} from "@crafting/config/professions"
import type { ChangeEvent } from "react"

const ALL = "all"

type ProfessionSelectProps = {
    value: ProfessionId | null
    onChange: (value: ProfessionId | null) => void
}

export const ProfessionSelect = ({
    value,
    onChange,
}: ProfessionSelectProps) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const next = event.target.value

        onChange(isProfessionId(next) ? next : null)
    }

    return (
        <NativeSelect.Root size="sm">
            <NativeSelect.Field
                value={value ?? ALL}
                aria-label="Profession"
                onChange={handleChange}
            >
                <option value={ALL}>All professions</option>

                {PROFESSION_IDS.map((id) => (
                    <option key={id} value={id}>
                        {PROFESSION_NAMES[id]}
                    </option>
                ))}
            </NativeSelect.Field>

            <NativeSelect.Indicator />
        </NativeSelect.Root>
    )
}
