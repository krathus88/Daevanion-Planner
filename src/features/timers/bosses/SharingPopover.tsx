import { Button, Flex, Icon, Popover, Portal } from "@chakra-ui/react"
import { LuUsers } from "react-icons/lu"
import { DiscordLogin } from "./DiscordLogin"
import { SharedTimersSwitch } from "./SharedTimersSwitch"

type SharingPopoverProps = {
    shared: boolean
    onSharedChange: (shared: boolean) => void
}

// Set once and rarely touched, so it stays out of the way.
export const SharingPopover = ({
    shared,
    onSharedChange,
}: SharingPopoverProps) => {
    return (
        <Popover.Root positioning={{ placement: "bottom-end" }}>
            <Popover.Trigger asChild>
                <Button variant="ghost" size="sm" flexShrink="0">
                    <Icon>
                        <LuUsers />
                    </Icon>
                    Sharing
                </Button>
            </Popover.Trigger>

            <Portal>
                <Popover.Positioner zIndex="popover">
                    <Popover.Content w="xs">
                        <Popover.Body p="3">
                            <Flex flexDir="column" gap="3">
                                <DiscordLogin />

                                <SharedTimersSwitch
                                    checked={shared}
                                    onChange={onSharedChange}
                                />
                            </Flex>
                        </Popover.Body>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    )
}
