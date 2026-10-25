import { Flex } from "@chakra-ui/react"
import type { PointerEvent } from "react"
import { LuGripVertical } from "react-icons/lu"

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
            title="Drag to move"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <LuGripVertical />
        </Flex>
    )
}
