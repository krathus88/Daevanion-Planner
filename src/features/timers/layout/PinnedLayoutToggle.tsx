import { Button, Icon } from "@chakra-ui/react"
import type { Ref } from "react"
import { LuChevronDown, LuColumns3 } from "react-icons/lu"
import { PINNED_LAYOUT_ID } from "./PinnedLayout"

type PinnedLayoutToggleProps = {
    ref?: Ref<HTMLButtonElement>
    open: boolean
    onToggle: () => void
}

// Opens the pinned layout editor right below it. Open, it becomes the
// panel's tab: same size and place, no bottom edge, sitting on the panel's
// top border so the two read as one shape.
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
            // Always 1px low, open or closed, so the label never moves:
            // open, that 1px covers the panel's top border.
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
            // Open, it stays the panel's colour so they don't come apart.
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
