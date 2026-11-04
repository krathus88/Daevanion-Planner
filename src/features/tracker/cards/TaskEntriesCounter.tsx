import { Button, Flex, IconButton, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import { spendEntry, type EntriesLeft } from "@tracker/logic/taskEntries"
import { Tooltip } from "@ui/tooltip"
import type { ChangeEvent } from "react"
import { LuMinus, LuPlus } from "react-icons/lu"

type TaskEntriesCounterProps = {
    left: EntriesLeft
    cap: number
    bonusCap: number
    label: string
    onChange: (left: EntriesLeft) => void
}

// Entries left: the recharged ones (typed to match the game) and the bonus
// tickets. "Use" spends the recharged ones first.
export const TaskEntriesCounter = ({
    left,
    cap,
    bonusCap,
    label,
    onChange,
}: TaskEntriesCounterProps) => {
    const handleUse = () => {
        onChange(spendEntry(left))
    }

    const handleBaseChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({ ...left, base: Number(event.target.value || "0") })
    }

    // Uses up the day's entries; bonus tickets stay.
    const handleUseAll = () => {
        onChange({ ...left, base: 0 })
    }

    const handleBonusDecrease = () => {
        onChange({ ...left, bonus: left.bonus - 1 })
    }

    const handleBonusIncrease = () => {
        onChange({ ...left, bonus: left.bonus + 1 })
    }

    const total = left.base + left.bonus
    // A full count wastes the next recharge, so it stands out.
    const isFull = left.base >= cap

    // The counts sit in a column, the bonus under the daily entries; Use and
    // Max act on both, so they stand beside the column.
    return (
        <Flex alignItems="center" gap="2">
            <Flex flexDir="column" alignItems="flex-start" gap="1">
                <Flex alignItems="center" gap="1">
                    <Text textStyle="caption">Left</Text>

                    <WholeNumberInput
                        size="xs"
                        value={String(left.base)}
                        w="10"
                        px="1"
                        color={isFull ? "app.accent" : undefined}
                        fontWeight="semibold"
                        textAlign="center"
                        aria-label={`Entries left: ${label}`}
                        onChange={handleBaseChange}
                    />

                    <Text minW="7" textStyle="caption">
                        /{cap}
                    </Text>
                </Flex>

                <Flex alignItems="center" gap="1">
                    <Text
                        textStyle="caption"
                        whiteSpace="nowrap"
                        aria-label={`Bonus tickets: ${label}`}
                    >
                        Bonus{" "}
                        {/* Red once capped, as new tickets would be wasted. */}
                        <Text
                            as="span"
                            color={
                                left.bonus >= bonusCap
                                    ? "app.dangerFaint"
                                    : "app.successFaint"
                            }
                            fontWeight="semibold"
                        >
                            {left.bonus}/{bonusCap}
                        </Text>
                    </Text>

                    <IconButton
                        variant="ghost"
                        size="2xs"
                        disabled={left.bonus <= 0}
                        aria-label={`One bonus less: ${label}`}
                        onClick={handleBonusDecrease}
                    >
                        <LuMinus />
                    </IconButton>

                    <IconButton
                        variant="ghost"
                        size="2xs"
                        disabled={left.bonus >= bonusCap}
                        aria-label={`One bonus more: ${label}`}
                        onClick={handleBonusIncrease}
                    >
                        <LuPlus />
                    </IconButton>
                </Flex>
            </Flex>

            <Flex alignItems="center" gap="1">
                <Tooltip
                    content="Spends a daily entry first, then a bonus ticket"
                    openDelay={300}
                >
                    <Button
                        variant="primary"
                        size="xs"
                        disabled={total <= 0}
                        aria-label={`Use one: ${label}`}
                        onClick={handleUse}
                    >
                        Use
                    </Button>
                </Tooltip>

                <Button
                    variant="ghost"
                    size="xs"
                    disabled={left.base <= 0}
                    aria-label={`All done: ${label}`}
                    onClick={handleUseAll}
                >
                    Max
                </Button>
            </Flex>
        </Flex>
    )
}
