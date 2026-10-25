import { Flex, Text } from "@chakra-ui/react"
import {
    PET_CATEGORY_IDS,
    type PetCategoryId,
} from "@pets/config/petCategories"
import { RequiredCategoryToggle } from "./RequiredCategoryToggle"

type RequiredCategoryFilterProps = {
    value: PetCategoryId[]
    onChange: (category: PetCategoryId, required: boolean) => void
}

// Keeps only spots that still have a pet of every picked type.
export const RequiredCategoryFilter = ({
    value,
    onChange,
}: RequiredCategoryFilterProps) => {
    return (
        <Flex flexWrap="wrap" alignItems="center" gap="1.5">
            <Text textStyle="label" mr="1">
                Must include
            </Text>

            <Flex
                flexWrap="wrap"
                gap="1.5"
                role="group"
                aria-label="Spots must include these pet types"
            >
                {PET_CATEGORY_IDS.map((category) => (
                    <RequiredCategoryToggle
                        key={category}
                        category={category}
                        required={value.includes(category)}
                        onChange={onChange}
                    />
                ))}
            </Flex>
        </Flex>
    )
}
