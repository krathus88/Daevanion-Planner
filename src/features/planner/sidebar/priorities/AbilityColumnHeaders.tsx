import { Flex, Text } from "@chakra-ui/react"
import { LIMIT_COLUMN_WIDTH, PLANNED_COLUMN_WIDTH } from "./abilityColumns"

export const AbilityColumnHeaders = () => {
    return (
        <Flex justifyContent="flex-end" gap="2" textStyle="caption">
            <Text w={LIMIT_COLUMN_WIDTH} textAlign="center">
                Rank
            </Text>

            <Text w={LIMIT_COLUMN_WIDTH} textAlign="center">
                Min
            </Text>

            <Text w={LIMIT_COLUMN_WIDTH} textAlign="center">
                Max
            </Text>

            {/* The planned "+N" column needs no header; each value has a tooltip. */}
            <Flex w={PLANNED_COLUMN_WIDTH} flexShrink="0" />
        </Flex>
    )
}
