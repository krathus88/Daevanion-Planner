import { Box } from "@chakra-ui/react"
import type { PetCategoryId } from "@pets/config/petCategories"

type CategoryDotProps = {
    category: PetCategoryId
}

export const CategoryDot = ({ category }: CategoryDotProps) => {
    return (
        <Box
            boxSize="2"
            flexShrink="0"
            bg={`pet.${category}`}
            borderRadius="full"
            aria-hidden="true"
        />
    )
}
