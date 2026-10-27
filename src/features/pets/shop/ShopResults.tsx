import { Flex, Text } from "@chakra-ui/react"
import type { ShopSummary } from "@pets/logic/shopCheck"
import { ShopPetGrid } from "./ShopPetGrid"

const getSummaryText = (needed: number, total: number) => {
    const pets = total === 1 ? "pet" : "pets"

    if (total === 0) {
        return "No pets found on sale."
    }

    if (needed === 0) {
        return `All ${total} ${pets} on sale are already Insight Lv3.`
    }

    return `${needed} of ${total} ${pets} on sale ${needed === 1 ? "isn't" : "aren't"} Insight Lv3 yet.`
}

type ShopResultsProps = {
    summary: ShopSummary
    skippedFiles: string[]
}

export const ShopResults = ({ summary, skippedFiles }: ShopResultsProps) => {
    const neededCount = summary.needed.length
    const total = neededCount + summary.maxed.length

    return (
        <Flex flexDir="column" gap="4">
            <Flex flexDir="column" gap="1">
                <Text fontSize="sm">{getSummaryText(neededCount, total)}</Text>

                <Text textStyle="hint">
                    Checked against the levels saved on this page.
                </Text>

                {summary.unknown > 0 && (
                    <Text textStyle="hint">
                        {summary.unknown} other{" "}
                        {summary.unknown === 1 ? "item was" : "items were"} left
                        out.
                    </Text>
                )}

                {skippedFiles.length > 0 && (
                    <Text textStyle="hint">
                        No shop cards found in {skippedFiles.join(", ")}.
                    </Text>
                )}
            </Flex>

            {neededCount > 0 && (
                <ShopPetGrid title="Worth buying" items={summary.needed} />
            )}

            {summary.maxed.length > 0 && (
                <ShopPetGrid title="Already Lv3" items={summary.maxed} />
            )}
        </Flex>
    )
}
