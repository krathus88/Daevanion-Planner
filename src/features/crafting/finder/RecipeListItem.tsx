import { chakra, Flex, Text } from "@chakra-ui/react"
import { ItemName } from "@crafting/ItemName"
import type { RecipeEntry } from "@crafting/logic/recipeList"
import { memo } from "react"
import { LuSparkles } from "react-icons/lu"

type RecipeListItemProps = {
    entry: RecipeEntry
    selected: boolean
    onSelect: (itemId: number) => void
}

// One line: icon, name, a Combo sparkle when its crafts can proc a Splendent
// item, and the level. memo: the list re-maps every row when the selection
// changes, and the compiler can't skip rows inside that map.
export const RecipeListItem = memo(function RecipeListItem({
    entry,
    selected,
    onSelect,
}: RecipeListItemProps) {
    const handleClick = () => {
        onSelect(entry.item.id)
    }

    return (
        <chakra.button
            px="2"
            py="1"
            w="full"
            flexShrink="0"
            display="flex"
            alignItems="center"
            gap="2"
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
            <chakra.span minW="0" flex="1" display="flex">
                <ItemName item={entry.item} />
            </chakra.span>

            {entry.combo && (
                <Flex
                    flexShrink="0"
                    color="purple.fg"
                    title="Combo: its crafts can make the Splendent version"
                    aria-label="Combo"
                >
                    <LuSparkles size={12} />
                </Flex>
            )}

            {entry.level && (
                <Text
                    minW="10"
                    color="app.muted"
                    fontSize="xs"
                    textAlign="right"
                    whiteSpace="nowrap"
                >
                    {entry.level}
                </Text>
            )}
        </chakra.button>
    )
})
