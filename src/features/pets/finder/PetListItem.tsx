import { chakra, Flex, Text } from "@chakra-ui/react"
import type { Pet, PetAtlas } from "@pets/data/petAtlas"
import { getPetMapCounts } from "@pets/logic/petFinder"
import { describePetSpawns } from "@pets/logic/petLabels"
import { CategoryDot } from "@pets/CategoryDot"
import { FarmPetLevelCard } from "@pets/farm/FarmPetLevelCard"
import { LevelBadge } from "@pets/LevelBadge"
import { PetIcon } from "@pets/PetIcon"
import { memo } from "react"

type PetListItemProps = {
    atlas: PetAtlas
    pet: Pet
    // Pet Insight level; 0 is locked.
    level: number
    selected: boolean
    onSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

// memo: the list re-maps every row when one changes (a selection, a
// level), and the compiler can't skip rows inside that map.
export const PetListItem = memo(function PetListItem({
    atlas,
    pet,
    level,
    selected,
    onSelect,
    onLevelChange,
}: PetListItemProps) {
    const handleClick = () => {
        onSelect(pet.id)
    }

    const spawns = describePetSpawns(pet, getPetMapCounts(atlas, pet))

    // A fill a shade darker than the panel, so each pet reads as its own row.
    // Right-click sets its level, like a spot's pets.
    return (
        <FarmPetLevelCard
            pet={pet}
            caption={spawns}
            level={level}
            hover="none"
            placement="right"
            onLevelChange={onLevelChange}
        >
            <chakra.button
                px="2"
                py="1.5"
                w="full"
                flexShrink="0"
                display="flex"
                alignItems="center"
                gap="2.5"
                layerStyle={selected ? "listItemActive" : "listItem"}
                bg={selected ? undefined : "app.row"}
                textAlign="left"
                cursor="button"
                _hover={
                    selected
                        ? undefined
                        : { bg: "app.hover", borderColor: "app.borderStrong" }
                }
                type="button"
                aria-pressed={selected}
                onClick={handleClick}
            >
                <PetIcon pet={pet} />

                <Flex minW="0" flex="1" flexDir="column" gap="0.5">
                    <Flex alignItems="center" gap="2">
                        <CategoryDot category={pet.category} />

                        <Text
                            flex="1"
                            fontSize="sm"
                            fontWeight="medium"
                            truncate
                        >
                            {pet.name}
                        </Text>

                        {level > 0 && <LevelBadge level={level} />}
                    </Flex>

                    <Text textStyle="caption" truncate>
                        {spawns}
                    </Text>
                </Flex>
            </chakra.button>
        </FarmPetLevelCard>
    )
})
