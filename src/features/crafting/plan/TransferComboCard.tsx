import { Flex, Grid, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { StatTile } from "@common/StatTile"
import { getItem, type CraftingData } from "@crafting/data/craftingData"
import { ItemName } from "@crafting/ItemName"
import { formatKinah } from "@crafting/logic/formatKinah"
import { getTransferCombo } from "@crafting/logic/transferCombo"
import { ItemMention } from "@crafting/mention/ItemMention"
import type { PlanSettings } from "@crafting/types"
import { LuSparkles } from "react-icons/lu"
import { arePricesLoading } from "@crafting/logic/craftPlan"
import { AmountLoading } from "./AmountLoading"
import { TransferComboMaterials } from "./TransferComboMaterials"

type TransferComboCardProps = {
    data: CraftingData
    // The main craft, a Transfer Crafting item (e.g. White Dragon Lord Ring).
    baseId: number
    settings: PlanSettings
    splendentId: number
    comboChance: number
}

// A combo that skips a Transfer Crafting step (a transfer's or a craft's, like
// True Dragon Lord Mace's): those items are bound and few, so it's not about
// odds over many crafts but what one proc skips, the next transfer.
export const TransferComboCard = ({
    data,
    baseId,
    settings,
    splendentId,
    comboChance,
}: TransferComboCardProps) => {
    const combo = getTransferCombo(
        data,
        settings,
        baseId,
        splendentId,
        comboChance,
    )

    if (!combo) {
        return null
    }

    const splendent = getItem(data, splendentId)
    const base = getItem(data, baseId)
    const missChance = Math.round((1 - combo.chance) * 100)
    const pricesLoading = arePricesLoading(settings)
    const formatAmount = (amount: number | null) => {
        return pricesLoading ? (
            <AmountLoading w="24" h="6" />
        ) : (
            formatKinah(amount)
        )
    }

    return (
        <Card borderColor="app.accent">
            <Flex alignItems="center" gap="2" color="app.accent">
                <LuSparkles aria-hidden />

                <Text textStyle="label" color="app.accent">
                    Combo · {comboChance}%
                </Text>
            </Flex>

            <ItemName item={splendent} wrap />

            <Text color="app.muted" fontSize="sm">
                Each <ItemMention item={base} />{" "}
                {data.recipes.get(baseId)?.transfer ? "transfer" : "craft"} has
                a {comboChance}% chance to make <ItemMention item={splendent} />{" "}
                straight away, skipping its transfer. If it doesn't proc, that
                transfer still needs:
            </Text>

            <TransferComboMaterials materials={combo.materials} />

            <Grid
                templateColumns={{
                    base: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                }}
                gap="4"
            >
                <StatTile
                    value={formatKinah(0)}
                    label={`Procs (${comboChance}%): nothing more`}
                    tone="success"
                />

                <StatTile
                    value={formatAmount(combo.extraCost)}
                    label={`Misses (${missChance}%): that transfer`}
                />

                <StatTile
                    value={formatAmount(
                        combo.extraCost === null
                            ? null
                            : combo.extraCost * (1 - combo.chance),
                    )}
                    label="Extra on average"
                />
            </Grid>

            {combo.extraCost === null && !pricesLoading && (
                <Text textStyle="hint">
                    Price those materials to see what a proc saves.
                </Text>
            )}
        </Card>
    )
}
