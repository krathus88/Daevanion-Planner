import { NativeSelect } from "@chakra-ui/react"
import {
    CATEGORY_NAMES,
    isCategoryId,
    PROFESSION_CATEGORIES,
    type CategoryId,
    type ProfessionId,
} from "@crafting/config/professions"
import type { ChangeEvent } from "react"

const ALL = "all"

type CategorySelectProps = {
    // Whose tabs to list; with none, only All.
    profession: ProfessionId | null
    value: CategoryId | null
    onChange: (value: CategoryId | null) => void
}

export const CategorySelect = ({
    profession,
    value,
    onChange,
}: CategorySelectProps) => {
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const next = event.target.value

        onChange(isCategoryId(next) ? next : null)
    }

    const categories = profession ? PROFESSION_CATEGORIES[profession] : []

    return (
        <NativeSelect.Root size="sm" disabled={!profession}>
            <NativeSelect.Field
                value={value ?? ALL}
                aria-label="Tab"
                onChange={handleChange}
            >
                <option value={ALL}>All</option>

                {categories.map((id) => (
                    <option key={id} value={id}>
                        {CATEGORY_NAMES[id]}
                    </option>
                ))}
            </NativeSelect.Field>

            <NativeSelect.Indicator />
        </NativeSelect.Root>
    )
}
