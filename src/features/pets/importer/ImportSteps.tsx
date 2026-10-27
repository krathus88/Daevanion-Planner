import { Flex, Text } from "@chakra-ui/react"
import { ImportStep } from "./ImportStep"

// How to take the screenshots, with the key words lit so they get read.
export const ImportSteps = () => {
    return (
        <Flex as="ol" flexDir="column" gap="2">
            <ImportStep step={1}>
                In game, open{" "}
                <Text as="span" color="app.accentHover" fontWeight="semibold">
                    Pets
                </Text>{" "}
                on the{" "}
                <Text as="span" color="app.accentHover" fontWeight="semibold">
                    ALL
                </Text>{" "}
                tab.
            </ImportStep>

            <ImportStep step={2}>
                Screenshot the pet grid,{" "}
                <Text as="span" fontWeight="semibold">
                    full screen or cropped around the grid
                </Text>
                .
            </ImportStep>

            <ImportStep step={3}>
                <Text as="span" fontWeight="semibold">
                    Scroll down and repeat
                </Text>{" "}
                until every pet has shown once.
            </ImportStep>
        </Flex>
    )
}
