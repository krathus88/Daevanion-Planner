import { chakra, Flex, Icon } from "@chakra-ui/react"
import { Card } from "@common/Card"
import type { ReactNode } from "react"
import { LuChevronDown } from "react-icons/lu"

type MinimizedBarProps = {
    // What the panel holds, in a line or two; clicking it expands the panel.
    children: ReactNode
    // Leading picture beside the lines, like the pet's portrait.
    media?: ReactNode
    // Controls of their own under the lines, like the spot's pets.
    footer?: ReactNode
    // Buttons after the expand area, like closing the pet.
    actions?: ReactNode
    onExpand: () => void
}

// A minimized top panel: a short summary that expands it again when clicked.
export const MinimizedBar = ({
    children,
    media,
    footer,
    actions,
    onExpand,
}: MinimizedBarProps) => {
    return (
        <Card px="3" py="2" gap="1.5">
            <Flex alignItems="center" gap="2">
                <chakra.button
                    minW="0"
                    flex="1"
                    display="flex"
                    alignItems="center"
                    gap="2.5"
                    borderRadius="sm"
                    textAlign="left"
                    cursor="button"
                    type="button"
                    title="Expand"
                    aria-expanded="false"
                    onClick={onExpand}
                >
                    {media}

                    <Flex minW="0" flex="1" flexDir="column" gap="0.5">
                        {children}
                    </Flex>

                    <Icon boxSize="4" color="app.muted">
                        <LuChevronDown />
                    </Icon>
                </chakra.button>

                {actions}
            </Flex>

            {footer}
        </Card>
    )
}
