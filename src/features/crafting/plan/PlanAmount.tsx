import { Flex, Text } from "@chakra-ui/react"
import { formatKinah } from "@crafting/logic/formatKinah"
import type { ReactNode } from "react"
import { AmountLoading } from "./AmountLoading"
import { HoverAmount } from "./HoverAmount"

type PlanAmountProps = {
    // Null while unknown: a dash.
    value: number | null
    // Market prices still loading: the Kinah would still change.
    loading: boolean
    caption: string
    // How it adds up, on hover.
    hover?: ReactNode
}

// One of the summary's big Kinah amounts, with what it is beside it and,
// when given, how it adds up on hover.
export const PlanAmount = ({
    value,
    loading,
    caption,
    hover,
}: PlanAmountProps) => {
    const amount = formatKinah(value)

    return (
        <Flex alignItems="baseline" gap="2">
            <Text
                color="app.fg"
                fontSize="2xl"
                fontWeight="bold"
                lineHeight="short"
            >
                {loading && <AmountLoading w="40" h="7" />}

                {!loading && hover === undefined && amount}

                {!loading && hover !== undefined && (
                    <HoverAmount content={hover}>{amount}</HoverAmount>
                )}
            </Text>

            <Text textStyle="caption">{caption}</Text>
        </Flex>
    )
}
