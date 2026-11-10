import { Flex, Text } from "@chakra-ui/react"
import { getProcOdds, type ComboValue } from "@crafting/logic/comboValue"
import { formatCount } from "@crafting/logic/formatKinah"

type ComboOddsProps = {
    value: ComboValue
    // The plan's attempts at the main craft.
    attempts: number
}

type OddsChipProps = {
    crafts: number
    caption: string
    // The plan's own attempts, set apart.
    isPlan?: boolean
}

const OddsChip = ({ crafts, caption, isPlan }: OddsChipProps) => {
    return (
        <Flex
            px="2.5"
            py="1.5"
            flexDir="column"
            bg="app.row"
            borderColor={isPlan ? "app.accent" : "app.border"}
            borderWidth="1px"
            borderRadius="md"
        >
            <Text color="app.fg" fontSize="sm" fontWeight="semibold">
                {formatCount(crafts)} {crafts === 1 ? "craft" : "crafts"}
            </Text>

            <Text textStyle="caption">{caption}</Text>
        </Flex>
    )
}

// How many crafts for how sure a proc is, and how sure this plan's are.
export const ComboOdds = ({ value, attempts }: ComboOddsProps) => {
    const planOdds = Math.round(getProcOdds(value.procChance, attempts) * 100)

    return (
        <Flex flexWrap="wrap" gap="2">
            {value.craftsFor.map((entry) => (
                <OddsChip
                    key={entry.confidence}
                    crafts={entry.crafts}
                    caption={`${entry.confidence}% sure of one`}
                />
            ))}

            {attempts > 0 && (
                <OddsChip
                    crafts={attempts}
                    caption={`Your plan: ${planOdds}% sure`}
                    isPlan
                />
            )}
        </Flex>
    )
}
