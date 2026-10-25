import { Button, Flex, Icon, Text } from "@chakra-ui/react"
import { LuSparkles } from "react-icons/lu"
import { LevelBadge } from "./LevelBadge"
import { PET_LEVELS } from "./logic/petLevels"

type LevelTipProps = {
    onDismiss: () => void
}

// Shown on the page until closed: the ranking only knows what users set.
// Inline and short, with the key words lit, so it gets read, not skipped.
export const LevelTip = ({ onDismiss }: LevelTipProps) => {
    return (
        <Flex
            px="4"
            py="3"
            flexWrap="wrap"
            alignItems="center"
            gap="3"
            bg="app.accentMuted"
            borderWidth="1px"
            borderLeftWidth="3px"
            borderColor="app.accent"
            borderRadius="lg"
            role="note"
        >
            <Flex
                boxSize="9"
                flexShrink="0"
                alignItems="center"
                justifyContent="center"
                bg="app.accent"
                borderRadius="full"
                color="app.accentFg"
            >
                <Icon boxSize="5">
                    <LuSparkles />
                </Icon>
            </Flex>

            <Flex minW="0" flex="1" flexDir="column" gap="1">
                <Text color="app.accentHover" fontWeight="semibold">
                    Set your pets' levels for better spots
                </Text>

                <Flex flexWrap="wrap" alignItems="center" gap="1.5">
                    <Text fontSize="sm">
                        Open a pet and pick its{" "}
                        <Text as="span" fontWeight="semibold">
                            Insight level
                        </Text>
                    </Text>

                    {PET_LEVELS.map((level) => (
                        <LevelBadge key={level} level={level} />
                    ))}

                    <Text fontSize="sm">
                        — update it as you progress.{" "}
                        <Text as="span" fontWeight="semibold">
                            Best spots
                        </Text>{" "}
                        then only counts pets you still need.
                    </Text>
                </Flex>
            </Flex>

            <Button variant="primary" size="sm" onClick={onDismiss}>
                Got it
            </Button>
        </Flex>
    )
}
