import { Flex, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import type { TreeLine } from "@crafting/logic/craftTree"
import { formatCount } from "@crafting/logic/formatKinah"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import type { ChangeEvent } from "react"
import { LuCheck } from "react-icons/lu"
import { TREE_COLUMN_WIDTHS } from "./treeColumns"

type CraftTreeColumnsProps = {
    line: TreeLine
    onPriceChange: (itemId: number, price: number | null) => void
}

const getPlanColor = (line: TreeLine) => {
    if (line.planNeed === 0) {
        return "app.subtle"
    }

    return line.covered ? "app.success" : "app.fg"
}

// A tree line's numbers: its price (editable, the same price wherever the
// item is used; none for Transfer Crafting, which the market doesn't sell), its craft cost when the plan crafts it, and how many the
// whole plan needs.
export const CraftTreeColumns = ({
    line,
    onPriceChange,
}: CraftTreeColumnsProps) => {
    const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value

        onPriceChange(
            line.item.id,
            text === "" ? null : Math.min(MAX_AMOUNT, Number(text)),
        )
    }

    const cheaperToBuy =
        line.price !== null &&
        line.craftCost !== null &&
        line.price < line.craftCost

    return (
        <Flex ml="auto" flexShrink="0" alignItems="center" gap="3">
            {!line.tradable && (
                <Text
                    w={TREE_COLUMN_WIDTHS.price}
                    color="app.subtle"
                    fontSize="xs"
                    textAlign="right"
                >
                    bound
                </Text>
            )}

            {line.tradable && (
                <WholeNumberInput
                    size="xs"
                    w={TREE_COLUMN_WIDTHS.price}
                    fallback={null}
                    value={line.price ?? ""}
                    textAlign="right"
                    placeholder="Price"
                    aria-label="Price (Kinah)"
                    onChange={handlePriceChange}
                />
            )}

            <Text
                w={TREE_COLUMN_WIDTHS.craft}
                color={cheaperToBuy ? "app.warning" : "app.muted"}
                fontSize="xs"
                textAlign="right"
                whiteSpace="nowrap"
                title={
                    cheaperToBuy
                        ? "Crafting costs more than buying it"
                        : undefined
                }
            >
                {line.step
                    ? line.craftCost === null
                        ? "—"
                        : formatCount(Math.round(line.craftCost))
                    : ""}
            </Text>

            <Flex
                w={TREE_COLUMN_WIDTHS.plan}
                alignItems="center"
                justifyContent="flex-end"
                gap="1"
                color={getPlanColor(line)}
                fontSize="xs"
                whiteSpace="nowrap"
            >
                {line.covered && line.planNeed > 0 && <LuCheck aria-hidden />}

                <Text>
                    {line.planNeed === 0
                        ? "—"
                        : line.covered
                          ? "in bag"
                          : formatCount(line.planNeed)}
                </Text>
            </Flex>
        </Flex>
    )
}
