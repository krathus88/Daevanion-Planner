import { Badge, Flex, Grid, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import { ItemName } from "@crafting/ItemName"
import type { PlanMaterial, PriceState } from "@crafting/logic/craftPlan"
import { formatCount } from "@crafting/logic/formatKinah"
import { describeMorph } from "@crafting/logic/stepLabels"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import { Tooltip } from "@ui/tooltip"
import type { ChangeEvent } from "react"
import { LuCheck } from "react-icons/lu"
import { BuyInsteadSwitch } from "./BuyInsteadSwitch"
import { ItemNameLink } from "./ItemNameLink"
import { ListedPriceText } from "./ListedPriceText"
import { PriceLoading } from "./PriceLoading"
import { MATERIAL_COLUMNS } from "./materialColumns"

type MaterialRowProps = {
    material: PlanMaterial
    // What its price spot shows: fixed, loading, or the field.
    priceState: PriceState
    // Crafted on the way, not gathered or bought.
    crafted: boolean
    // False for Transfer Crafting: bound price, never bought instead.
    tradable: boolean
    // As saved; can be more than the plan needs.
    owned: number
    onOwnedChange: (itemId: number, owned: number) => void
    onPriceChange: (itemId: number, price: number | null) => void
    onBoughtChange: (itemId: number, bought: boolean) => void
    // Opens a craftable item's own craft.
    onItemSelect: (itemId: number) => void
}

const readAmount = (text: string) => {
    return Math.min(MAX_AMOUNT, Math.max(0, Number(text)))
}

// One line of the materials table: a material, or an item crafted on the way.
export const MaterialRow = ({
    material,
    priceState,
    crafted,
    tradable,
    owned,
    onOwnedChange,
    onPriceChange,
    onBoughtChange,
    onItemSelect,
}: MaterialRowProps) => {
    const itemId = material.item.id

    const handleOwnedChange = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value

        onOwnedChange(itemId, text === "" ? 0 : readAmount(text))
    }

    const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value

        onPriceChange(itemId, text === "" ? null : readAmount(text))
    }

    const handleBoughtChange = (bought: boolean) => {
        onBoughtChange(itemId, bought)
    }

    const caption = crafted
        ? "Crafted"
        : material.morph && (
              <Tooltip
                  content={describeMorph(
                      material.morph.item.name,
                      material.morph.price,
                  )}
                  openDelay={300}
              >
                  <Badge size="xs" variant="subtle" colorPalette="purple">
                      via {material.morph.item.name}
                  </Badge>
              </Tooltip>
          )
    const done = material.missing === 0
    const have = material.need - material.missing
    const showCost = material.cost !== null && !done

    return (
        <Grid
            px="3"
            py="1.5"
            {...MATERIAL_COLUMNS}
            bg="app.row"
            opacity={done ? "dimmed" : undefined}
            borderColor="app.border"
            borderWidth="1px"
            borderRadius="md"
            role="group"
            aria-label={material.item.name}
        >
            <Flex gridArea="name" minW="0" flexDir="column" gap="1">
                {material.craftable ? (
                    <ItemNameLink
                        item={material.item}
                        caption={caption}
                        onSelect={onItemSelect}
                    />
                ) : (
                    <ItemName item={material.item} wrap caption={caption} />
                )}

                {material.craftable && tradable && (
                    <BuyInsteadSwitch
                        checked={!crafted}
                        onChange={handleBoughtChange}
                    />
                )}
            </Flex>

            <Flex
                gridArea="have"
                alignItems="center"
                justifyContent="flex-end"
                gap="1"
                fontSize="sm"
                whiteSpace="nowrap"
            >
                {done && <LuCheck aria-hidden />}

                <Text
                    color={done ? "app.success" : "app.fg"}
                    fontWeight="semibold"
                >
                    {formatCount(have)}
                </Text>

                <Text color="app.subtle">/ {formatCount(material.need)}</Text>
            </Flex>

            <WholeNumberInput
                size="xs"
                gridArea="bag"
                value={owned}
                textAlign="right"
                aria-label="In the bag"
                onChange={handleOwnedChange}
            />

            {!tradable && (
                <Text
                    gridArea="price"
                    color="app.subtle"
                    fontSize="xs"
                    textAlign="right"
                >
                    bound
                </Text>
            )}

            {tradable && priceState.kind === "listed" && (
                <ListedPriceText gridArea="price" price={priceState.price} />
            )}

            {tradable && priceState.kind === "loading" && (
                <PriceLoading gridArea="price" />
            )}

            {tradable && priceState.kind === "own" && (
                <WholeNumberInput
                    size="xs"
                    gridArea="price"
                    fallback={null}
                    value={priceState.value ?? ""}
                    textAlign="right"
                    placeholder="—"
                    aria-label="Price (Kinah)"
                    onChange={handlePriceChange}
                />
            )}

            <Text
                gridArea="kinah"
                color={showCost ? "app.fg" : "app.subtle"}
                fontSize="sm"
                textAlign="right"
                whiteSpace="nowrap"
            >
                {showCost ? formatCount(Math.round(material.cost ?? 0)) : "—"}
            </Text>
        </Grid>
    )
}
