import { Button, Flex, Icon, IconButton, Text } from "@chakra-ui/react"
import type { BossReport } from "@timers/storage/timerSettings"
import { Tooltip } from "@ui/tooltip"
import { Term } from "@common/Term"
import { useEffect, useRef, useState } from "react"
import { LuTimerOff } from "react-icons/lu"
import { DurationInput } from "@timers/card/DurationInput"

// The longest respawn; the in-game timer never shows more.
const MAX_HOURS = 12

type BossReportFormProps = {
    focusRequest: boolean
    onChange: (report: BossReport) => void
    onClear?: () => void
}

// Only Update sets the timer, not Enter.
export const BossReportForm = ({
    focusRequest,
    onChange,
    onClear,
}: BossReportFormProps) => {
    const [hours, setHours] = useState(0)
    const [minutes, setMinutes] = useState(0)
    const [seconds, setSeconds] = useState(0)
    const fieldsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!focusRequest) {
            return
        }

        // The fields can't take focus until the row has opened.
        const frame = requestAnimationFrame(() => {
            fieldsRef.current?.querySelector("input")?.focus()
        })

        return () => {
            cancelAnimationFrame(frame)
        }
    }, [focusRequest])

    const handleUpdate = () => {
        const now = Date.now()

        onChange({
            spawnAt: now + ((hours * 60 + minutes) * 60 + seconds) * 1000,
            reportedAt: now,
        })
        setHours(0)
        setMinutes(0)
        setSeconds(0)
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="label">Spawns in (in-game timer)</Text>

            <Flex ref={fieldsRef} flexWrap="wrap" alignItems="center" gap="1.5">
                <DurationInput
                    value={hours}
                    max={MAX_HOURS}
                    unit="h"
                    compact
                    label="Hours"
                    onChange={setHours}
                />

                <DurationInput
                    value={minutes}
                    max={59}
                    unit="m"
                    compact
                    label="Minutes"
                    onChange={setMinutes}
                />

                <DurationInput
                    value={seconds}
                    max={59}
                    unit="s"
                    compact
                    label="Seconds"
                    onChange={setSeconds}
                />

                {/* Wraps as one, so Clear never drops below Update. */}
                <Flex alignItems="center" gap="1">
                    <Button variant="primary" size="sm" onClick={handleUpdate}>
                        Update
                    </Button>

                    {onClear && (
                        <Tooltip
                            content="Clear timer"
                            openDelay={100}
                            showArrow
                        >
                            <IconButton
                                variant="dangerGhost"
                                size="sm"
                                aria-label="Clear timer"
                                onClick={onClear}
                            >
                                <Icon boxSize="4">
                                    <LuTimerOff />
                                </Icon>
                            </IconButton>
                        </Tooltip>
                    )}
                </Flex>
            </Flex>

            <Text textStyle="hint">
                <Term>Map → Exploration → Field Boss</Term>. Enter 0 if it just
                spawned.
            </Text>
        </Flex>
    )
}
