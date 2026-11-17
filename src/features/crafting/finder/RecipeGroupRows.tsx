import { Flex, Text } from "@chakra-ui/react"
import type { RecipeGroup } from "@crafting/logic/recipeGroups"
import { FavoriteStar } from "./FavoriteStar"
import { RecipeListItem } from "./RecipeListItem"

type RecipeGroupRowsProps = {
    group: RecipeGroup
    selectedId?: number
    onSelect: (itemId: number) => void
    onFavoriteChange: (groupKey: string, favorite: boolean) => void
}

// One tab's heading with its favorite star, which sticks while its rows
// scroll, then its rows.
export const RecipeGroupRows = ({
    group,
    selectedId,
    onSelect,
    onFavoriteChange,
}: RecipeGroupRowsProps) => {
    const handleFavoriteChange = (favorite: boolean) => {
        onFavoriteChange(group.key, favorite)
    }

    return (
        <Flex flexDir="column" gap="1">
            <Flex
                className="group"
                pos="sticky"
                top="0"
                py="1"
                alignItems="center"
                justifyContent="space-between"
                gap="2"
                bg="app.raised"
            >
                <Flex alignItems="center" gap="1">
                    <FavoriteStar
                        favorite={group.favorite}
                        label={group.title}
                        onChange={handleFavoriteChange}
                    />

                    <Text textStyle="label">{group.title}</Text>
                </Flex>

                <Text textStyle="caption">{group.profession}</Text>
            </Flex>

            {group.entries.map((entry) => (
                <RecipeListItem
                    key={entry.item.id}
                    entry={entry}
                    selected={entry.item.id === selectedId}
                    onSelect={onSelect}
                />
            ))}
        </Flex>
    )
}
