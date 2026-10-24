import { Button, Icon } from "@chakra-ui/react"
import type { Ref } from "react"
import { LuChevronDown, LuColumns3 } from "react-icons/lu"
import { PINNED_LAYOUT_ID } from "./PinnedLayout"

type PinnedLayoutToggleProps = {
    ref?: Ref<HTMLButtonElement>
    open: boolean
    onToggle: () => void
}

export const PinnedLayoutToggle = ({
    ref,
    open,
    onToggle,
}: PinnedLayoutToggleProps) => {
    return (
        <Button
            ref={ref}
            variant="secondary"
            size="xs"
            pos="relative"
            // Always 1px low so the label never moves; open, it covers the panel border.
            bottom="-1px"
            zIndex="docked"
            h="7"
            px="3"
            gap="1.5"
            bg="app.raised"
            borderColor="app.border"
            borderBottomColor={open ? "app.raised" : "app.border"}
            borderRadius="md"
            borderBottomRadius={open ? "none" : "md"}
            borderWidth="1px"
            color={open ? "app.fg" : "app.muted"}
            fontWeight="medium"
            transitionProperty="common"
            transitionDuration="fast"
            _hover={{ bg: open ? "app.raised" : "app.hover", color: "app.fg" }}
            aria-controls={PINNED_LAYOUT_ID}
            aria-expanded={open}
            onClick={onToggle}
        >
            <Icon boxSize="3.5">
                <LuColumns3 />
            </Icon>
            Edit layout
            <Icon
                boxSize="3.5"
                transform={open ? "rotate(180deg)" : undefined}
                transitionProperty="transform"
                transitionDuration="fast"
            >
                <LuChevronDown />
            </Icon>
        </Button>
    )
}
