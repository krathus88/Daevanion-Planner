import { Flex } from "@chakra-ui/react"
import type { ComboValue } from "@crafting/logic/comboValue"
import { OddsChip } from "./OddsChip"

type ComboOddsProps = {
    value: ComboValue
}

// How many crafts for how sure a proc is.
export const ComboOdds = ({ value }: ComboOddsProps) => {
    return (
        <Flex flexWrap="wrap" gap="2">
            {value.craftsFor.map((entry) => (
                <OddsChip
                    key={entry.confidence}
                    crafts={entry.crafts}
                    caption={`${entry.confidence}% sure of one`}
                />
            ))}
        </Flex>
    )
}
