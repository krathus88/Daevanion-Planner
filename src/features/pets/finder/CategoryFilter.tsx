import { SegmentGroup, Text } from "@chakra-ui/react"
import {
    isPetCategoryId,
    PET_CATEGORY_IDS,
    PET_CATEGORY_NAMES,
    type PetCategoryId,
} from "@pets/config/petCategories"

const ALL = "all"

// Each type's name in its color, as in the list's dots and the spot filter.
const items = [
    { value: ALL, label: "All" },
    ...PET_CATEGORY_IDS.map((id) => ({
        value: id,
        label: (
            <Text as="span" color={`pet.${id}`}>
                {PET_CATEGORY_NAMES[id]}
            </Text>
        ),
    })),
]

type CategoryFilterProps = {
    value: PetCategoryId | null
    onChange: (value: PetCategoryId | null) => void
}

export const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        onChange(isPetCategoryId(details.value) ? details.value : null)
    }

    return (
        <SegmentGroup.Root
            size="xs"
            layout="fill"
            value={value ?? ALL}
            minW="0"
            // Narrower items so all six fit the list's width, phones included.
            css={{
                "& [data-part=item]": {
                    px: { base: "0.5", md: "2" },
                    fontSize: { base: "xs", md: "sm" },
                },
            }}
            aria-label="Pet type"
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            <SegmentGroup.Items items={items} />
        </SegmentGroup.Root>
    )
}
