import { Flex, Text } from "@chakra-ui/react"
import { GRADE_LABELS } from "@config/items/grades"
import { usePlanContext } from "@crafting/context/planContext"
import type { CraftingItem } from "@crafting/data/craftingData"
import { ItemName } from "@crafting/ItemName"
import { describeItemSource, describeItemPrice } from "@crafting/logic/itemInfo"

type ItemHoverCardProps = {
    item: CraftingItem
}

// An item's card on hover: icon, name and grade, how you get it, your price.
export const ItemHoverCard = ({ item }: ItemHoverCardProps) => {
    const { data, settings } = usePlanContext()

    return (
        <Flex maxW="xs" flexDir="column" gap="1.5">
            <ItemName
                item={item}
                wrap
                caption={item.grade ? GRADE_LABELS[item.grade] : undefined}
            />

            <Text fontSize="xs">{describeItemSource(data, item.id)}</Text>

            <Text fontSize="xs">
                {describeItemPrice(data, settings, item.id)}
            </Text>
        </Flex>
    )
}
