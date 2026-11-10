import { Badge, Flex, Text } from "@chakra-ui/react"
import { ItemName } from "@crafting/ItemName"
import type { TreeLine } from "@crafting/logic/craftTree"
import { formatCount } from "@crafting/logic/formatKinah"
import { ItemNameLink } from "./ItemNameLink"

type CraftTreeRowProps = {
    line: TreeLine
    // Set for an item with a recipe: its name opens its craft.
    onSelect?: (itemId: number) => void
}

// "3× Orichalcum Ingot", with a note when it's cheaper by Substance Morph.
export const CraftTreeRow = ({ line, onSelect }: CraftTreeRowProps) => {
    const caption = line.morph && (
        <Badge size="xs" variant="subtle" colorPalette="purple">
            via {line.morph.item.name} · {formatCount(line.morph.price)}
        </Badge>
    )

    return (
        <Flex minW="40" flex="1" alignItems="center" gap="2">
            <Text
                flexShrink="0"
                color="app.muted"
                fontSize="sm"
                fontWeight="semibold"
            >
                {formatCount(line.perCraft)}×
            </Text>

            {onSelect ? (
                <ItemNameLink
                    item={line.item}
                    caption={caption}
                    onSelect={onSelect}
                />
            ) : (
                <ItemName item={line.item} wrap caption={caption} />
            )}
        </Flex>
    )
}
