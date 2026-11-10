import { Flex, Text } from "@chakra-ui/react"
import { TREE_COLUMN_WIDTHS } from "./treeColumns"

// "Each craft uses", with the number columns' names above them (hidden on
// phones, where the numbers wrap under the names).
export const CraftTreeHeader = () => {
    return (
        <Flex px="2" alignItems="flex-end" gap="3">
            <Text flex="1" textStyle="label">
                Each craft uses
            </Text>

            <Text
                display={{ base: "none", sm: "block" }}
                w={TREE_COLUMN_WIDTHS.price}
                textStyle="caption"
                textAlign="right"
            >
                Price each
            </Text>

            <Text
                display={{ base: "none", sm: "block" }}
                w={TREE_COLUMN_WIDTHS.craft}
                textStyle="caption"
                textAlign="right"
            >
                Craft cost
            </Text>

            <Text
                display={{ base: "none", sm: "block" }}
                w={TREE_COLUMN_WIDTHS.plan}
                textStyle="caption"
                textAlign="right"
            >
                For the plan
            </Text>
        </Flex>
    )
}
