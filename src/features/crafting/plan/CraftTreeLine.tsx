import { Collapsible, Flex } from "@chakra-ui/react"
import type { CraftingData } from "@crafting/data/craftingData"
import type { PlanIndex, TreeLine } from "@crafting/logic/craftTree"
import type { PlanSettings } from "@crafting/types"
import { useState, type MouseEvent } from "react"
import { LuChevronRight } from "react-icons/lu"
import { BoughtLineBody } from "./BoughtLineBody"
import { CraftStepBody } from "./CraftStepBody"
import { CraftTreeColumns } from "./CraftTreeColumns"
import { CraftTreeRow } from "./CraftTreeRow"
import type { PlanHandlers } from "./planHandlers"

type CraftTreeLineProps = {
    data: CraftingData
    line: TreeLine
    settings: PlanSettings
    index: PlanIndex
    handlers: PlanHandlers
}

// One material in the tree. A crafted one opens into its own recipe; a
// craftable one bought instead opens to undo that; the rest just show.
export const CraftTreeLine = ({
    data,
    line,
    settings,
    index,
    handlers,
}: CraftTreeLineProps) => {
    const [open, setOpen] = useState(false)

    const handleOpenChange = (details: Collapsible.OpenChangeDetails) => {
        setOpen(details.open)
    }

    // A click anywhere on the line opens it, except on its own buttons and
    // fields (the item's name opens that item instead).
    const handleRowClick = (event: MouseEvent<HTMLDivElement>) => {
        if (
            event.target instanceof Element &&
            event.target.closest("button, input, label")
        ) {
            return
        }

        setOpen(!open)
    }

    const bought = line.material?.craftable === true

    if (!line.step && !bought) {
        return (
            <Flex
                px="2"
                py="1.5"
                flexWrap="wrap"
                alignItems="center"
                columnGap="2"
                rowGap="1"
                bg="app.row"
                borderColor="app.border"
                borderWidth="1px"
                borderRadius="md"
                role="group"
                aria-label={line.item.name}
            >
                {/* Where the chevron sits on lines that open. */}
                <Flex w="4" flexShrink="0" />

                {/* Any item with a recipe opens its craft, even one this
                plan doesn't need (its parent is in the bag). */}
                <CraftTreeRow
                    line={line}
                    onSelect={
                        data.recipes.has(line.item.id)
                            ? handlers.onItemSelect
                            : undefined
                    }
                />

                <CraftTreeColumns
                    line={line}
                    onPriceChange={handlers.onPriceChange}
                />
            </Flex>
        )
    }

    return (
        <Collapsible.Root
            open={open}
            lazyMount
            unmountOnExit
            bg="app.row"
            borderColor="app.border"
            borderWidth="1px"
            borderRadius="md"
            role="group"
            aria-label={line.item.name}
            onOpenChange={handleOpenChange}
        >
            {/* Only the chevron is the trigger: the name and price field
            can't sit inside a button. */}
            <Flex
                px="2"
                py="1.5"
                flexWrap="wrap"
                alignItems="center"
                columnGap="2"
                rowGap="1"
                cursor="button"
                onClick={handleRowClick}
            >
                <Collapsible.Trigger
                    w="auto"
                    flexShrink="0"
                    aria-label={`${line.item.name} recipe`}
                >
                    <Collapsible.Indicator>
                        <LuChevronRight size={16} />
                    </Collapsible.Indicator>
                </Collapsible.Trigger>

                <CraftTreeRow line={line} onSelect={handlers.onItemSelect} />

                <CraftTreeColumns
                    line={line}
                    onPriceChange={handlers.onPriceChange}
                />
            </Flex>

            {/* Indented from the left only, so the cost columns of every
            level line up. */}
            <Collapsible.Content>
                <Flex
                    ml="4"
                    pl="3"
                    pt="1"
                    pb="3"
                    flexDir="column"
                    borderLeftWidth="2px"
                    borderColor="app.border"
                >
                    {line.step ? (
                        <CraftStepBody
                            data={data}
                            step={line.step}
                            settings={settings}
                            index={index}
                            isTarget={false}
                            handlers={handlers}
                        />
                    ) : (
                        <BoughtLineBody
                            line={line}
                            owned={settings.owned[line.item.id] ?? 0}
                            onOwnedChange={handlers.onOwnedChange}
                            onBoughtChange={handlers.onBoughtChange}
                        />
                    )}
                </Flex>
            </Collapsible.Content>
        </Collapsible.Root>
    )
}
