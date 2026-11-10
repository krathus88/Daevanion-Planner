import { Text } from "@chakra-ui/react"
import type { CraftingItem } from "@crafting/data/craftingData"
import { Tooltip } from "@ui/tooltip"
import { ItemHoverCard } from "./ItemHoverCard"

type ItemMentionProps = {
    item: CraftingItem
}

// An item named in a sentence: its grade's color, underlined, with its card
// on hover or focus.
export const ItemMention = ({ item }: ItemMentionProps) => {
    return (
        <Tooltip content={<ItemHoverCard item={item} />} openDelay={200}>
            <Text
                as="span"
                color={item.grade ? `grade.${item.grade}` : "app.fg"}
                fontWeight="semibold"
                textDecoration="underline"
                textDecorationStyle="dotted"
                cursor="help"
                tabIndex={0}
            >
                {item.name}
            </Text>
        </Tooltip>
    )
}
