import { Flex } from "@chakra-ui/react"
import { arePricesLoading, getPriceState } from "@crafting/logic/craftPlan"
import type { MaterialIndexRow } from "@crafting/logic/materialOrder"
import type { PlanSettings } from "@crafting/types"
import { MaterialListHeader } from "./MaterialListHeader"
import { MaterialRow } from "./MaterialRow"

type MaterialListProps = {
    rows: MaterialIndexRow[]
    settings: PlanSettings
    onOwnedChange: (itemId: number, owned: number) => void
    onPriceChange: (itemId: number, price: number | null) => void
    onBoughtChange: (itemId: number, bought: boolean) => void
    onItemSelect: (itemId: number) => void
}

// A table of every item the plan uses, grouped by kind (gear first); the
// ones the bag covers are dimmed, crafted ones tagged.
export const MaterialList = ({
    rows,
    settings,
    onOwnedChange,
    onPriceChange,
    onBoughtChange,
    onItemSelect,
}: MaterialListProps) => {
    return (
        <Flex flexDir="column" gap="1">
            <MaterialListHeader />

            {rows.map((row) => (
                <MaterialRow
                    key={row.material.item.id}
                    material={row.material}
                    priceState={getPriceState(settings, row.material.item.id)}
                    crafted={row.crafted}
                    tradable={row.tradable}
                    pricesLoading={arePricesLoading(settings)}
                    owned={settings.owned[row.material.item.id] ?? 0}
                    onOwnedChange={onOwnedChange}
                    onPriceChange={onPriceChange}
                    onBoughtChange={onBoughtChange}
                    onItemSelect={onItemSelect}
                />
            ))}
        </Flex>
    )
}
