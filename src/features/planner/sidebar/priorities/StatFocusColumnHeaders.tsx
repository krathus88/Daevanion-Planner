import { Flex, Text } from "@chakra-ui/react"
import { LIMIT_COLUMN_WIDTH } from "./abilityColumns"

type StatFocusColumnHeadersProps = {
    // Hides the rank columns, which one board doesn't use.
    isBoard: boolean
}

export const StatFocusColumnHeaders = ({
    isBoard,
}: StatFocusColumnHeadersProps) => {
    return (
        <Flex justifyContent="flex-end" gap="2" textStyle="caption">
            {!isBoard && (
                <Text
                    w={LIMIT_COLUMN_WIDTH}
                    textAlign="center"
                    title="Passives ranked after this wait behind the stat"
                >
                    Passive
                </Text>
            )}

            {!isBoard && (
                <Text
                    w={LIMIT_COLUMN_WIDTH}
                    textAlign="center"
                    title="Skills ranked after this wait behind the stat"
                >
                    Skill
                </Text>
            )}

            <Text w={LIMIT_COLUMN_WIDTH} textAlign="center">
                Detour
            </Text>
        </Flex>
    )
}
