import { Button, Flex, Text } from "@chakra-ui/react"
import type { BossReport } from "@timers/storage/timerSettings"
import { useEffect, useRef, useState } from "react"
import { DurationInput } from "@timers/card/DurationInput"

// The longest respawn; the in-game timer never shows more.
const MAX_HOURS = 12

type BossReportFormProps = {
    // Put the cursor in it, e.g. from a "set timer" chip.
    focusRequest: boolean
    onChange: (report: BossReport) => void
}

// Takes the countdown from the in-game Field Boss list. Only the Update
// button sets the timer, not Enter in a field.
export const BossReportForm = ({
    focusRequest,
    onChange,
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

            <Flex ref={fieldsRef} flexWrap="wrap" alignItems="center" gap="2">
                <DurationInput
                    value={hours}
                    max={MAX_HOURS}
                    unit="h"
                    label="Hours"
                    onChange={setHours}
                />

                <DurationInput
                    value={minutes}
                    max={59}
                    unit="m"
                    label="Minutes"
                    onChange={setMinutes}
                />

                <DurationInput
                    value={seconds}
                    max={59}
                    unit="s"
                    label="Seconds"
                    onChange={setSeconds}
                />

                <Button variant="primary" size="sm" onClick={handleUpdate}>
                    Update
                </Button>
            </Flex>

            <Text textStyle="hint">
                Open the map, then Exploration, then Field Boss, and copy the
                time left. Enter 0 if it just spawned.
            </Text>
        </Flex>
    )
}
