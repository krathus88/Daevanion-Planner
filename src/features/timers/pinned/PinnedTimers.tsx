import { Box, Flex, useBreakpointValue, type FlexProps } from "@chakra-ui/react"
import { useTimers, type TimerEntry } from "@timers/hooks/useTimers"
import { useLayoutEffect, useRef, useState } from "react"
import { SetTimerChip } from "./SetTimerChip"
import { TimerChip } from "./TimerChip"

const renderChip = (entry: TimerEntry, now: number) => {
    return entry.state.status === "unset" ? (
        <SetTimerChip key={entry.timer.id} entry={entry} now={now} />
    ) : (
        <TimerChip key={entry.timer.id} entry={entry} now={now} />
    )
}

// Whether the timers fit in one line across the frame. `measureRef` holds a
// hidden one-line copy, so the answer doesn't depend on the layout shown.
const useFitsOneLine = (enabled: boolean) => {
    const frameRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<HTMLDivElement>(null)
    const [fits, setFits] = useState(true)

    useLayoutEffect(() => {
        const frame = frameRef.current
        const measure = measureRef.current
        if (!enabled || !frame || !measure) {
            return
        }

        // Fires once on observe, then whenever the frame or a countdown
        // changes width.
        const observer = new ResizeObserver(() => {
            setFits(measure.offsetWidth <= frame.clientWidth)
        })
        observer.observe(frame)
        observer.observe(measure)

        return () => observer.disconnect()
    }, [enabled])

    return { frameRef: frameRef, measureRef: measureRef, fits: fits }
}

// The pinned timers in the header. Beside the class picker (desktop) they
// are laid out as the user arranged them: columns read from the right, each
// with one timer or two stacked. On their own row (smaller screens) they are
// centred and take one line in that same order, right to left, until it no
// longer fits; then the arranged columns, scrolling sideways if needed.
export const PinnedTimers = ({ ...props }: FlexProps) => {
    const { now, pinnedColumns, settings } = useTimers()
    // Matches the header, which gives the timers their own row below xl.
    const isOwnRow = useBreakpointValue({ base: true, xl: false }) ?? false
    const isShown = settings.showPinned && pinnedColumns.length > 0
    const { frameRef, measureRef, fits } = useFitsOneLine(isOwnRow && isShown)

    if (!isShown) {
        return null
    }

    const columns = pinnedColumns.map((column) => (
        <Flex
            key={column[0].timer.id}
            flexShrink="0"
            flexDir="column"
            justifyContent="center"
            gap="0.5"
        >
            {column.map((entry) => renderChip(entry, now))}
        </Flex>
    ))

    if (!isOwnRow) {
        return (
            <Flex
                minW="0"
                flexDir="row-reverse"
                gap="1"
                overflowX="auto"
                aria-label="Pinned timers"
                {...props}
            >
                {columns}
            </Flex>
        )
    }

    // Column by column, top then bottom: the order the columns read in.
    const inOrder = pinnedColumns.flat()

    return (
        <Flex
            ref={frameRef}
            pos="relative"
            minW="0"
            // Starts scrolled to the right, where the first timer is.
            flexDir="row-reverse"
            overflowX="auto"
            aria-label="Pinned timers"
            {...props}
        >
            {/* Auto margins centre it and, unlike justify-content, still
                let a too-wide row scroll from its start. */}
            <Flex
                mx="auto"
                flexShrink="0"
                flexDir="row-reverse"
                alignItems="center"
                gap="1"
            >
                {fits
                    ? inOrder.map((entry) => renderChip(entry, now))
                    : columns}
            </Flex>

            {/* The one-line copy that useFitsOneLine measures. Zero-sized
                and clipped, so it never adds to the scroll width. */}
            <Box
                pos="absolute"
                top="0"
                left="0"
                w="0"
                h="0"
                overflow="hidden"
                visibility="hidden"
                aria-hidden="true"
                inert
            >
                <Flex ref={measureRef} w="max" gap="1">
                    {inOrder.map((entry) => renderChip(entry, now))}
                </Flex>
            </Box>
        </Flex>
    )
}
