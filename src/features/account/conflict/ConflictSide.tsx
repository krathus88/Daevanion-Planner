import {
    formatEditTime,
    type ConflictSideSummary,
} from "@account/sync/conflictSummary"
import { Flex, Text } from "@chakra-ui/react"

type ConflictSideProps = {
    side: ConflictSideSummary
}

export const ConflictSide = ({ side }: ConflictSideProps) => {
    return (
        <Flex minW="0" flexDir="column">
            <Text fontSize="sm">{side.detail}</Text>

            <Text textStyle="caption">{formatEditTime(side.time)}</Text>
        </Flex>
    )
}
