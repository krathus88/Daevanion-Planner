import { chakra } from "@chakra-ui/react"
import { CategoryDot } from "@pets/CategoryDot"
import {
    PET_CATEGORY_NAMES,
    type PetCategoryId,
} from "@pets/config/petCategories"

type RequiredCategoryToggleProps = {
    category: PetCategoryId
    required: boolean
    onChange: (category: PetCategoryId, required: boolean) => void
}

// One chip of the "Must include" multi-select, outlined in its type's color.
export const RequiredCategoryToggle = ({
    category,
    required,
    onChange,
}: RequiredCategoryToggleProps) => {
    const handleClick = () => {
        onChange(category, !required)
    }

    return (
        <chakra.button
            px="2.5"
            py="0.5"
            display="flex"
            alignItems="center"
            gap="1.5"
            bg={required ? "app.hover" : "transparent"}
            borderWidth="1px"
            borderColor={required ? `pet.${category}` : "app.border"}
            borderRadius="full"
            color={required ? "app.fg" : "app.muted"}
            fontSize="xs"
            fontWeight="medium"
            cursor="button"
            _hover={{ color: "app.fg", borderColor: `pet.${category}` }}
            type="button"
            aria-pressed={required}
            onClick={handleClick}
        >
            <CategoryDot category={category} />

            {PET_CATEGORY_NAMES[category]}
        </chakra.button>
    )
}
