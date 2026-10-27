import { Flex, Icon, Text } from "@chakra-ui/react"
import { LuTriangleAlert } from "react-icons/lu"

// Cut-off cards are skipped and covered ones misread, so this is lit up
// rather than left in the instructions.
export const ImportCardWarning = () => {
    return (
        <Flex
            px="3"
            py="2.5"
            alignItems="flex-start"
            gap="2.5"
            bg="app.accentMuted"
            borderWidth="1px"
            borderLeftWidth="3px"
            borderColor="app.accent"
            borderRadius="md"
            role="note"
        >
            <Icon mt="0.5" boxSize="4" flexShrink="0" color="app.accent">
                <LuTriangleAlert />
            </Icon>

            <Flex flexDir="column" gap="0.5">
                <Text
                    color="app.accentHover"
                    fontSize="sm"
                    fontWeight="semibold"
                >
                    Every pet card must be whole and uncovered
                </Text>

                <Text fontSize="sm">
                    Cards cut off by the screenshot's edge are skipped, and
                    cards under the mouse cursor or a tooltip can be misread.
                </Text>
            </Flex>
        </Flex>
    )
}
