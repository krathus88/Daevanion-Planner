import { Flex, Heading, Text, useBreakpointValue } from "@chakra-ui/react"
import { Children, type ReactNode } from "react"
import { dealCards } from "./cardColumns"

type CardGridProps = {
    children: ReactNode
    title: string
    caption?: string
    // A rough height per card, in order: each card goes under the column
    // with the least so far. Missing, every card weighs 1.
    weights?: readonly number[]
}

// A titled set of card columns: one on phones, up to three. Each column stacks
// on its own, so a short (minimized) card pulls the one below it up.
export const CardGrid = ({
    children,
    title,
    caption,
    weights,
}: CardGridProps) => {
    const count =
        useBreakpointValue({ base: 1, md: 2, xl: 3 }, { ssr: false }) ?? 1
    const cards = Children.toArray(children)
    const columns = dealCards(
        cards.map((_, index) => weights?.[index] ?? 1),
        count,
    ).map((column) => column.map((index) => cards[index]))

    return (
        <Flex as="section" flexDir="column" gap="3" aria-label={title}>
            <Flex flexWrap="wrap" alignItems="baseline" columnGap="3">
                <Heading as="h2" size="md">
                    {title}
                </Heading>

                {caption && <Text textStyle="hint">{caption}</Text>}
            </Flex>

            <Flex alignItems="flex-start" gap="4">
                {columns.map((column, index) => (
                    <Flex
                        key={index}
                        minW="0"
                        flex="1"
                        flexDir="column"
                        gap="4"
                    >
                        {column}
                    </Flex>
                ))}
            </Flex>
        </Flex>
    )
}
