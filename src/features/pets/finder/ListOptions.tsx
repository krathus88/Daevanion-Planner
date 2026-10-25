import { Flex, Icon, IconButton, Popover, Portal, Text } from "@chakra-ui/react"
import { LuSettings } from "react-icons/lu"
import { HideLevelToggleList } from "./HideLevelToggleList"

type ListOptionsProps = {
    hiddenLevels: number[]
    onLevelHiddenChange: (level: number, hidden: boolean) => void
}

// Gear menu for the pet list; "Hide" picks any Pet Insight levels to hide.
export const ListOptions = ({
    hiddenLevels,
    onLevelHiddenChange,
}: ListOptionsProps) => {
    const active = hiddenLevels.length > 0

    return (
        <Popover.Root positioning={{ placement: "bottom-start" }}>
            <Popover.Trigger asChild>
                <IconButton
                    minW="6"
                    h="6"
                    variant="ghost"
                    size="xs"
                    color={active ? "app.accent" : "app.muted"}
                    aria-label="List options"
                >
                    <Icon boxSize="4">
                        <LuSettings />
                    </Icon>
                </IconButton>
            </Popover.Trigger>

            <Portal>
                <Popover.Positioner zIndex="popover">
                    <Popover.Content w="xs">
                        <Popover.Body p="3">
                            <Flex flexDir="column" gap="3">
                                <Flex flexDir="column" gap="1">
                                    <Text fontSize="sm" fontWeight="semibold">
                                        Hide pets by Insight level
                                    </Text>

                                    <Text textStyle="hint">
                                        Pick any levels: their pets leave the
                                        list and the map. Locked pets always
                                        show.
                                    </Text>
                                </Flex>

                                <Flex alignItems="center" gap="2">
                                    <Text fontSize="sm" fontWeight="medium">
                                        Hide
                                    </Text>

                                    <Flex
                                        flex="1"
                                        gap="1.5"
                                        role="group"
                                        aria-label="Hide pets at these Insight levels"
                                    >
                                        <HideLevelToggleList
                                            hiddenLevels={hiddenLevels}
                                            onChange={onLevelHiddenChange}
                                        />
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    )
}
