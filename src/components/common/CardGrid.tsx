import { Flex, Heading, Text, useBreakpointValue } from "@chakra-ui/react"
import { Children, type ReactNode } from "react"

type CardGridProps = {
    children: ReactNode
    title: string
    caption?: string
}

// Deals the cards out left to right, one per column in turn.
const toColumns = (cards: ReactNode[], count: number) => {
    const columns: ReactNode[][] = []

    for (let index = 0; index < count; index++) {
        columns.push([])
    }

    cards.forEach((card, index) => {
        columns[index % count].push(card)
    })

    return columns
}

// A titled set of card columns: one on phones, up to three. Each column stacks
// on its own, so a short (minimized) card pulls the one below it up.
export const CardGrid = ({ children, title, caption }: CardGridProps) => {
    const count =
        useBreakpointValue({ base: 1, md: 2, xl: 3 }, { ssr: false }) ?? 1
    const columns = toColumns(Children.toArray(children), count)

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
