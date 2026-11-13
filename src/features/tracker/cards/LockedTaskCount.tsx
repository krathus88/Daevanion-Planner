import { Text } from "@chakra-ui/react"
import type { EntriesLeft } from "@tracker/logic/taskEntries"
import { CompanionLocked } from "@account/CompanionLocked"

type LockedTaskCountProps = {
    // An entries task's entries left, else the count done.
    entries?: EntriesLeft
    count: number
    cap: number
    bonusCap: number
    label: string
}

// A task the companion app fills, as just its number, like Odyle Energy's
// total: entries left of the cap and bonus tickets ("5/14 +2"), or the count
// done ("1/4"). No buttons: the game's value can't be changed here. Colors
// match the editable counters: full entries accent, a done count green,
// capped bonus tickets red. The count and bonus are larger than the cap.
export const LockedTaskCount = ({
    entries,
    count,
    cap,
    bonusCap,
    label,
}: LockedTaskCountProps) => {
    const value = entries ?? { base: count, bonus: 0 }
    const showBonus = entries !== undefined && bonusCap > 0
    const isFull = value.base >= cap
    const spoken =
        entries === undefined
            ? `${value.base} of ${cap} done`
            : `${value.base} of ${cap} entries left` +
              (bonusCap > 0 ? `, ${value.bonus} bonus` : "")
    const fullColor = entries === undefined ? "app.success" : "app.accent"

    return (
        <CompanionLocked locked>
            <Text
                px="1"
                fontSize="xs"
                fontVariantNumeric="tabular-nums"
                whiteSpace="nowrap"
                aria-label={`${label}: ${spoken}`}
            >
                <Text
                    as="span"
                    color={isFull ? fullColor : "app.fg"}
                    fontSize="md"
                    fontWeight="semibold"
                >
                    {value.base}
                </Text>
                <Text as="span" color="app.subtle">
                    /{cap}
                </Text>
                {showBonus && (
                    <Text
                        as="span"
                        color={
                            value.bonus >= bonusCap
                                ? "app.dangerFaint"
                                : "app.successFaint"
                        }
                        fontSize="md"
                        fontWeight="semibold"
                    >
                        {` +${value.bonus}`}
                    </Text>
                )}
            </Text>
        </CompanionLocked>
    )
}
