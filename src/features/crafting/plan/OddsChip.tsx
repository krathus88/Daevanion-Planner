import { Flex, Text } from "@chakra-ui/react"
import { formatCount } from "@crafting/logic/formatKinah"

type OddsChipProps = {
    crafts: number
    // How sure that many crafts are: "90% sure of one".
    caption: string
    // Part of something with more on hover: a dotted underline says so.
    hoverable?: boolean
}

// A number of crafts and how sure they are, in a small box.
export const OddsChip = ({
    crafts,
    caption,
    hoverable = false,
}: OddsChipProps) => {
    return (
        <Flex
            px="2.5"
            py="1.5"
            flexDir="column"
            bg="app.row"
            borderColor="app.border"
            borderWidth="1px"
            borderRadius="md"
        >
            <Text color="app.fg" fontSize="sm" fontWeight="semibold">
                {formatCount(crafts)} {crafts === 1 ? "craft" : "crafts"}
            </Text>

            <Text
                textStyle="caption"
                textDecoration={hoverable ? "underline" : "none"}
                textDecorationStyle="dotted"
            >
                {caption}
            </Text>
        </Flex>
    )
}
