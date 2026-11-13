import { Flex, Icon, IconButton, Popover, Portal, Text } from "@chakra-ui/react"
import { LuTriangleAlert } from "react-icons/lu"

type CorridorsWarningProps = {
    label: string
    ownerLabel: string
}

// Beside a corridor row while the companion runs but hasn't read the
// character's entrances since the siege: the game sends them only on
// entering the Abyss, so whether it's done is unknown until then.
export const CorridorsWarning = ({
    label,
    ownerLabel,
}: CorridorsWarningProps) => {
    return (
        // Mounted only while open, like ArenaWeekWarning.
        <Popover.Root
            lazyMount
            unmountOnExit
            positioning={{ placement: "bottom-start" }}
        >
            <Popover.Trigger asChild>
                <IconButton
                    minW="5"
                    h="5"
                    flexShrink="0"
                    variant="ghost"
                    size="xs"
                    color="app.warning"
                    _hover={{ color: "app.warning" }}
                    aria-label={`${label}: no data from the game yet`}
                >
                    <Icon boxSize="4">
                        <LuTriangleAlert />
                    </Icon>
                </IconButton>
            </Popover.Trigger>

            <Portal>
                <Popover.Positioner zIndex="popover">
                    <Popover.Content w="xs">
                        <Popover.Body p="3">
                            <Flex flexDir="column" gap="3">
                                <Text fontSize="sm" fontWeight="semibold">
                                    No data since the siege
                                </Text>

                                <Text textStyle="hint">
                                    The game sends corridor entrances only in
                                    the Abyss. Go to the Abyss on {ownerLabel}{" "}
                                    with the companion app running and this
                                    fills in; until then you can set it by hand.
                                </Text>
                            </Flex>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    )
}
