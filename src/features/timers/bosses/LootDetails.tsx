import { Flex, Text } from "@chakra-ui/react"
import type { LootDetailRow } from "@timers/logic/lootDetails"
import { LootDetailLine } from "./LootDetailLine"

type LootDetailsProps = {
    title: string
    rows: readonly LootDetailRow[]
}

// A titled list of lines inside a loot tooltip. A line's children hang
// under it on a guide line, inset from both sides.
export const LootDetails = ({ title, rows }: LootDetailsProps) => {
    return (
        <Flex
            mt="1.5"
            pt="1.5"
            flexDir="column"
            gap="0.5"
            borderColor="app.border"
            borderTopWidth="1px"
        >
            <Text color="app.muted" lineHeight="short">
                {title}
            </Text>

            {rows.map((row) => (
                <Flex key={row.label} flexDir="column" gap="0.5">
                    <LootDetailLine row={row} />

                    {row.children && (
                        <Flex
                            ml="1"
                            mr="8"
                            pl="2.5"
                            flexDir="column"
                            gap="0.5"
                            borderColor="app.borderStrong"
                            borderLeftWidth="1px"
                        >
                            {row.children.map((child) => (
                                <LootDetailLine
                                    key={child.label}
                                    row={child}
                                    nested
                                />
                            ))}
                        </Flex>
                    )}
                </Flex>
            ))}
        </Flex>
    )
}
