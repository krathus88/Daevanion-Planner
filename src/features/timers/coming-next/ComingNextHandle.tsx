import { Flex } from "@chakra-ui/react"
import type { PointerEvent } from "react"
import { LuGripVertical } from "react-icons/lu"
import { revealOnStripHover } from "./hoverReveal"

// maxW matches the grip icon, so it grows in step with `slideWithHandle`.
const reveal = revealOnStripHover({ side: "start", maxW: "4" })

type ComingNextHandleProps = {
    dragging: boolean
    onPointerDown: (event: PointerEvent<HTMLElement>) => void
    onPointerMove: (event: PointerEvent<HTMLElement>) => void
    onPointerUp: (event: PointerEvent<HTMLElement>) => void
}

export const ComingNextHandle = ({
    dragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}: ComingNextHandleProps) => {
    return (
        <Flex
            alignSelf="stretch"
            flexShrink="0"
            alignItems="center"
            borderRadius="sm"
            color="app.muted"
            cursor={dragging ? "grabbing" : "grab"}
            touchAction="none"
            _hover={{ bg: "app.hover", color: "app.fg" }}
            css={dragging ? undefined : reveal}
            title="Drag to move"
            data-folds="start"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <LuGripVertical />
        </Flex>
    )
}
