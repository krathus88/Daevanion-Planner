import { Flex, Text } from "@chakra-ui/react"
import { NumberedStep } from "@common/NumberedStep"

export const ShopSteps = () => {
    return (
        <Flex as="ol" flexDir="column" gap="2">
            <NumberedStep step={1}>
                In game, open the{" "}
                <Text as="span" color="app.accentHover" fontWeight="semibold">
                    Shop
                </Text>{" "}
                on the{" "}
                <Text as="span" color="app.accentHover" fontWeight="semibold">
                    Pets
                </Text>{" "}
                or{" "}
                <Text as="span" color="app.accentHover" fontWeight="semibold">
                    Special
                </Text>{" "}
                tab.
            </NumberedStep>

            <NumberedStep step={2}>
                Screenshot it,{" "}
                <Text as="span" fontWeight="semibold">
                    full screen or cropped around the cards
                </Text>
                , with every card whole and uncovered.
            </NumberedStep>
        </Flex>
    )
}
