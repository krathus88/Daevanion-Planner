import { Flex, Text } from "@chakra-ui/react"
import { getProcOdds, type ComboValue } from "@crafting/logic/comboValue"
import { formatCount } from "@crafting/logic/formatKinah"

type ComboOddsProps = {
    value: ComboValue
    // The plan's attempts at the main craft.
    attempts: number
}

const wholePercent = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
})

const oneDecimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })

// How many crafts for how sure a proc is, and what this plan's attempts give.
export const ComboOdds = ({ value, attempts }: ComboOddsProps) => {
    return (
        <Flex flexDir="column" gap="1.5">
            <Flex flexWrap="wrap" gap="2">
                {value.craftsFor.map((entry) => (
                    <Flex
                        key={entry.confidence}
                        px="2.5"
                        py="1.5"
                        flexDir="column"
                        bg="app.row"
                        borderColor="app.border"
                        borderWidth="1px"
                        borderRadius="md"
                    >
                        <Text
                            color="app.fg"
                            fontSize="sm"
                            fontWeight="semibold"
                        >
                            {formatCount(entry.crafts)}{" "}
                            {entry.crafts === 1 ? "craft" : "crafts"}
                        </Text>

                        <Text textStyle="caption">
                            {entry.confidence}% sure of one
                        </Text>
                    </Flex>
                ))}
            </Flex>

            {attempts > 0 && (
                <Text color="app.muted" fontSize="sm">
                    This plan's {formatCount(attempts)}{" "}
                    {attempts === 1 ? "attempt" : "attempts"}:{" "}
                    {wholePercent.format(
                        getProcOdds(value.procChance, attempts),
                    )}{" "}
                    chance of at least one, about{" "}
                    {oneDecimal.format(attempts * value.procChance)} on average.
                </Text>
            )}
        </Flex>
    )
}
