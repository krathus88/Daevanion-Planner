import { Menu, Portal } from "@chakra-ui/react"
import type { ReactElement } from "react"
import { ComingNextCountStepper } from "./ComingNextCountStepper"

type ComingNextMenuProps = {
    children: ReactElement
    count: number
    onCountChange: (count: number) => void
}

// Opens on right-click (long-press on touch) anywhere on the strip.
export const ComingNextMenu = ({
    children,
    count,
    onCountChange,
}: ComingNextMenuProps) => {
    return (
        <Menu.Root>
            <Menu.ContextTrigger asChild>{children}</Menu.ContextTrigger>

            <Portal>
                <Menu.Positioner zIndex="popover">
                    <Menu.Content px="3" py="2">
                        <ComingNextCountStepper
                            value={count}
                            onChange={onCountChange}
                        />
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    )
}
