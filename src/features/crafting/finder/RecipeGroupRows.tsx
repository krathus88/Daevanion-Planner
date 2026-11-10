import { Flex, Text } from "@chakra-ui/react"
import type { RecipeGroup } from "@crafting/logic/recipeGroups"
import { RecipeListItem } from "./RecipeListItem"

type RecipeGroupRowsProps = {
    group: RecipeGroup
    selectedId?: number
    onSelect: (itemId: number) => void
}

// One tab's heading, which sticks while its rows scroll, then its rows.
export const RecipeGroupRows = ({
    group,
    selectedId,
    onSelect,
}: RecipeGroupRowsProps) => {
    return (
        <Flex flexDir="column" gap="1">
            <Flex
                pos="sticky"
                top="0"
                py="1"
                alignItems="baseline"
                justifyContent="space-between"
                gap="2"
                bg="app.raised"
            >
                <Text textStyle="label">{group.title}</Text>

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
