import { Flex, Grid, Text } from "@chakra-ui/react"
import { NumberField } from "@common/NumberField"
import type { TreeLine } from "@crafting/logic/craftTree"
import { formatCount } from "@crafting/logic/formatKinah"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import { BuyInsteadSwitch } from "./BuyInsteadSwitch"
import { STEP_FIELD_COLUMNS } from "./stepFieldColumns"

type BoughtLineBodyProps = {
    line: TreeLine
    // As saved.
    owned: number
    onOwnedChange: (itemId: number, owned: number) => void
    onBoughtChange: (itemId: number, bought: boolean) => void
}

// A craftable item bought instead, laid out like a crafted line's body (status
// line, then the fields) so Buy instead stays in the same spot to switch back.
export const BoughtLineBody = ({
    line,
    owned,
    onOwnedChange,
    onBoughtChange,
}: BoughtLineBodyProps) => {
    const handleOwnedChange = (value: number | null) => {
        onOwnedChange(line.item.id, value ?? 0)
    }

    const handleBoughtChange = (bought: boolean) => {
        onBoughtChange(line.item.id, bought)
    }

    return (
        <Flex flexDir="column" gap="2.5">
            <Text color="app.fg" fontSize="sm">
                {formatCount(line.planNeed)} needed · bought instead
            </Text>

            <Grid templateColumns={STEP_FIELD_COLUMNS} alignItems="end" gap="3">
                <NumberField
                    value={owned}
                    label="In the bag"
                    max={MAX_AMOUNT}
                    onChange={handleOwnedChange}
                />

                {/* Where a crafted line has its Success %. */}
                <Flex />

                <Flex h="8" alignItems="center">
                    <BuyInsteadSwitch checked onChange={handleBoughtChange} />
                </Flex>
            </Grid>

            <Text textStyle="hint">
                Its price is on its line above; switch Buy instead off to craft
                it again.
            </Text>
        </Flex>
    )
}
