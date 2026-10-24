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

// Measures a hidden one-line copy, so the result doesn't depend on the
// layout shown.
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

        const observer = new ResizeObserver(() => {
            setFits(measure.offsetWidth <= frame.clientWidth)
        })
        observer.observe(frame)
        observer.observe(measure)

        return () => observer.disconnect()
    }, [enabled])

    return { frameRef: frameRef, measureRef: measureRef, fits: fits }
}

// On their own row: one line while it fits, otherwise the arranged columns.
export const PinnedTimers = ({ ...props }: FlexProps) => {
    const { now, pinnedColumns, settings } = useTimers()
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

    const inOrder = pinnedColumns.flat()

    return (
        <Flex
            ref={frameRef}
            pos="relative"
            minW="0"
            flexDir="row-reverse"
            overflowX="auto"
            aria-label="Pinned timers"
            {...props}
        >
            {/* Unlike justify-content, auto margins let a wide row scroll from its start. */}
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

            {/* Zero-sized and clipped so it never adds scroll width. */}
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
