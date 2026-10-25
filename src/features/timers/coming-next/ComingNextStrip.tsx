import { Box, Container, Flex, Portal } from "@chakra-ui/react"
import { useComingNextDrag } from "@timers/hooks/useComingNextDrag"
import type { TimerEntry } from "@timers/hooks/useTimers"
import type { ComingNextPosition } from "@timers/logic/comingNextPosition"
import { TimerChip } from "@timers/pinned/TimerChip"
import { ComingNextHandle } from "./ComingNextHandle"
import { ComingNextToggle } from "./ComingNextToggle"

type ComingNextStripProps = {
    entries: TimerEntry[]
    now: number
    position: ComingNextPosition | null
    open: boolean
    onToggle: () => void
    onMove: (position: ComingNextPosition) => void
}

// Floats over the page, so the board never moves. Portalled because the
// header's backdrop blur would trap position: fixed.
export const ComingNextStrip = ({
    entries,
    now,
    position,
    open,
    onToggle,
    onMove,
}: ComingNextStripProps) => {
    const {
        anchorRef,
        stripRef,
        topLeft,
        isDragging,
        isDocked,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
    } = useComingNextDrag(position, onMove)

    return (
        <>
            <Container pos="absolute" right="0" bottom="0" left="0" maxW="8xl">
                <Box ref={anchorRef} h="0" />
            </Container>

            <Portal>
                <Flex
                    ref={stripRef}
                    pos="fixed"
                    zIndex="sticky"
                    px="1"
                    py={open ? "1" : "0"}
                    maxW="full"
                    style={{ left: topLeft?.x, top: topLeft?.y }}
                    alignItems="center"
                    gap="1"
                    bg="app.panel"
                    borderColor="app.border"
                    borderWidth="1px"
                    borderTopWidth={isDocked ? "0" : "1px"}
                    borderRadius={isDocked ? "none" : "md"}
                    borderBottomRadius="md"
                    boxShadow={isDragging ? "lg" : "md"}
                    visibility={topLeft ? "visible" : "hidden"}
                    aria-label="Coming next"
                >
                    <ComingNextHandle
                        dragging={isDragging}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                    />

                    {open && (
                        <Flex
                            id="coming-next-list"
                            minW="0"
                            gap="1"
                            overflowX="auto"
                        >
                            {entries.map((entry) => (
                                <TimerChip
                                    key={entry.timer.id}
                                    entry={entry}
                                    now={now}
                                />
                            ))}
                        </Flex>
                    )}

                    <ComingNextToggle open={open} onToggle={onToggle} />
                </Flex>
            </Portal>
        </>
    )
}
