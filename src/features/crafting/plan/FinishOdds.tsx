import { Flex } from "@chakra-ui/react"
import { Tooltip } from "@ui/tooltip"
import type { FinishChance } from "@crafting/logic/craftOdds"
import { formatFinish } from "@crafting/logic/summaryLabels"
import type { ReactNode } from "react"
import { OddsChip } from "./OddsChip"

type FinishOddsProps = {
    finishes: FinishChance[]
    // The expected cost with failures, on hover; none while unpriced.
    hover?: ReactNode
}

// How sure the crafts it takes, and a couple more, are to be enough.
export const FinishOdds = ({ finishes, hover }: FinishOddsProps) => {
    const chips = (
        <Flex flexWrap="wrap" gap="2" cursor={hover ? "help" : undefined}>
            {finishes.map((entry) => (
                <OddsChip
                    key={entry.crafts}
                    crafts={entry.crafts}
                    caption={
                        entry.chance >= 1
                            ? "Always succeeds"
                            : `${formatFinish(entry.chance)} sure`
                    }
                    hoverable={hover !== undefined}
                />
            ))}
        </Flex>
    )

    if (hover === undefined) {
        return chips
    }

    return (
        <Tooltip content={hover} openDelay={200}>
            {chips}
        </Tooltip>
    )
}
