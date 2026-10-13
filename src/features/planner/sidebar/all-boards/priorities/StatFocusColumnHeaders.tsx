import { Flex, Text } from "@chakra-ui/react"
import { LIMIT_COLUMN_WIDTH } from "./abilityColumns"

export const StatFocusColumnHeaders = () => {
    return (
        <Flex justifyContent="flex-end" gap="2" textStyle="caption">
            <Text w={LIMIT_COLUMN_WIDTH} textAlign="center">
                After
            </Text>

            <Text w={LIMIT_COLUMN_WIDTH} textAlign="center">
                Up to
            </Text>
        </Flex>
    )
}
