import { Flex, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import type { PetCategoryId } from "@pets/config/petCategories"
import type { Pet, PetAtlas } from "@pets/data/petAtlas"
import { ImportDialog } from "@pets/importer/ImportDialog"
import { LevelBadgeList } from "@pets/LevelBadgeList"
import { ShopCheckDialog } from "@pets/shop/ShopCheckDialog"
import { CategoryFilter } from "./CategoryFilter"
import { ListOptions } from "./ListOptions"
import { PetList } from "./PetList"
import { PetSearchField } from "./PetSearchField"

type PetFinderProps = {
    atlas: PetAtlas
    pets: Pet[]
    levels: Record<string, number>
    query: string
    category: PetCategoryId | null
    hiddenLevels: number[]
    selectedPetId?: number
    onQueryChange: (query: string) => void
    onCategoryChange: (category: PetCategoryId | null) => void
    onLevelHiddenChange: (level: number, hidden: boolean) => void
    onPetSelect: (petId: number) => void
}

export const PetFinder = ({
    atlas,
    pets,
    levels,
    query,
    category,
    hiddenLevels,
    selectedPetId,
    onQueryChange,
    onCategoryChange,
    onLevelHiddenChange,
    onPetSelect,
}: PetFinderProps) => {
    return (
        <Card
            pos={{ lg: "sticky" }}
            top={{ lg: "20" }}
            w={{ base: "full", lg: "petList" }}
            maxH={{ base: "lg", lg: "sidebarMaxH" }}
        >
            <Flex alignItems="center" gap="1">
                <PetSearchField value={query} onChange={onQueryChange} />

                <ImportDialog atlas={atlas} />

                <ShopCheckDialog atlas={atlas} />

                <ListOptions
                    hiddenLevels={hiddenLevels}
                    onLevelHiddenChange={onLevelHiddenChange}
                />
            </Flex>

            <CategoryFilter value={category} onChange={onCategoryChange} />

            <Flex alignItems="center" gap="2">
                <Flex minW="0" flex="1" alignItems="center" gap="1">
                    {hiddenLevels.length > 0 && (
                        <>
                            <Text textStyle="caption">Hiding</Text>

                            <LevelBadgeList levels={hiddenLevels} />
                        </>
                    )}
                </Flex>

                <Text textStyle="caption">{pets.length} shown</Text>
            </Flex>

            <Flex
                mx="-1"
                px="1"
                minH="0"
                flex="1"
                flexDir="column"
                gap="1"
                overflowY="auto"
            >
                {pets.length > 0 ? (
                    <PetList
                        atlas={atlas}
                        pets={pets}
                        levels={levels}
                        selectedPetId={selectedPetId}
                        onSelect={onPetSelect}
                    />
                ) : (
                    <Text py="4" color="app.muted" fontSize="sm">
                        No pets match. Try a monster name, or clear the filters.
                    </Text>
                )}
            </Flex>
        </Card>
    )
}
