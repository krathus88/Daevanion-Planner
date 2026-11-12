import {
    Button,
    Flex,
    Icon,
    IconButton,
    Popover,
    Portal,
    Text,
} from "@chakra-ui/react"
import { LuTriangleAlert } from "react-icons/lu"

type ArenaWeekWarningProps = {
    label: string
    onConfirm: () => void
}

// Beside an arena task whose week the companion couldn't work out: says
// why, and lets the user confirm the counts shown. Entering a count does the
// same; either way the game fills the week again from there.
export const ArenaWeekWarning = ({
    label,
    onConfirm,
}: ArenaWeekWarningProps) => {
    return (
        // Mounted only while open: a card has up to four of these, and their
        // closed panels took a press inside the open one for one outside it.
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
                    aria-label={`${label}: this week's count isn't filled from the game`}
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
                                    Not filled this week
                                </Text>

                                <Text textStyle="hint">
                                    The companion app missed the weekly reset,
                                    and the game sends only lifetime arena
                                    results per mode, so this week&apos;s
                                    matches can&apos;t be told apart. Enter this
                                    week&apos;s counts, or confirm the ones
                                    shown, and the game fills them again from
                                    there.
                                </Text>

                                {/* Not a close trigger, which closes on the
                                press, before the click lands. Confirming
                                removes the warning, popover and all. */}
                                <Button
                                    variant="primary"
                                    size="xs"
                                    alignSelf="flex-start"
                                    onClick={onConfirm}
                                >
                                    Counts are right
                                </Button>
                            </Flex>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    )
}
