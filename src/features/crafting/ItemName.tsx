import { Flex, Text } from "@chakra-ui/react"
import type { CraftingItem } from "@crafting/data/craftingData"
import type { ReactNode } from "react"
import { ItemIcon } from "./ItemIcon"

type ItemNameProps = {
    item: CraftingItem
    size?: "sm" | "md"
    // A line under the name.
    caption?: ReactNode
    // Lets a small name wrap instead of being cut.
    wrap?: boolean
}

// Icon and name in its grade's color, like the game's item names.
export const ItemName = ({
    item,
    size = "sm",
    caption,
    wrap = false,
}: ItemNameProps) => {
    return (
        <Flex minW="0" alignItems="center" gap="2.5">
            <ItemIcon item={item} size={size === "md" ? "10" : "7"} />

            <Flex minW="0" flexDir="column" gap="0.5">
                <Text
                    color={item.grade ? `grade.${item.grade}` : "app.fg"}
                    fontSize={size === "md" ? "lg" : "sm"}
                    fontWeight={size === "md" ? "semibold" : "medium"}
                    lineHeight="short"
                    // The page's title item wraps; list rows stay one line
                    // unless asked.
                    truncate={size === "sm" && !wrap}
                >
                    {item.name}
                </Text>

                {caption && (
                    <Text textStyle="caption" truncate>
                        {caption}
                    </Text>
                )}
            </Flex>
        </Flex>
    )
}
