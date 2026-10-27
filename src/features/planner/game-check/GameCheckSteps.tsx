import { Flex, Text } from "@chakra-ui/react"
import { NumberedStep } from "@common/NumberedStep"

// How to take the screenshots, with the key words lit so they get read.
export const GameCheckSteps = () => {
    return (
        <Flex as="ol" flexDir="column" gap="2">
            <NumberedStep step={1}>
                In game, open{" "}
                <Text as="span" color="app.accentHover" fontWeight="semibold">
                    Daevanion
                </Text>{" "}
                on the board you copied.
            </NumberedStep>

            <NumberedStep step={2}>
                Screenshot it,{" "}
                <Text as="span" fontWeight="semibold">
                    full screen or cropped around the whole board
                </Text>
                .
            </NumberedStep>

            <NumberedStep step={3}>
                <Text as="span" fontWeight="semibold">
                    Repeat for other boards
                </Text>{" "}
                and drop them all at once.
            </NumberedStep>
        </Flex>
    )
}
