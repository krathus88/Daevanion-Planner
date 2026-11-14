import { Flex, Icon, IconButton, Popover, Portal, Text } from "@chakra-ui/react"
import { LuTriangleAlert } from "react-icons/lu"

type ShopDataWarningProps = {
    label: string
    ownerLabel: string
    shopName: string
}

// Beside a shop goal (gameIds SHOP_TASKS) while the companion runs but has no
// counts for this character: the game sends them only when the shop opens.
// The goal stays locked meanwhile, so it's never typed in by hand.
export const ShopDataWarning = ({
    label,
    ownerLabel,
    shopName,
}: ShopDataWarningProps) => {
    return (
        // Mounted only while open, like CorridorsWarning.
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
                                    No data yet
                                </Text>

                                <Text textStyle="hint">
                                    Open the {shopName} on {ownerLabel} with the
                                    companion app running.
                                </Text>
                            </Flex>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    )
}
